import type { Express } from "express";
import { storage } from "../storage";
import { authStorage } from "../replit_integrations/auth/storage";

function getPublishedDomain(req: any): string {
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(",");
    const appDomain = domains.find(d => d.includes(".replit.app"));
    if (appDomain) return `https://${appDomain}`;
  }
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || req.hostname;
  return `${protocol}://${host}`;
}

async function createAsaasPaymentLink(params: {
  name: string;
  description: string;
  value: number;
  externalReference: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; id: string } | null> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    console.error("ASAAS_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.asaas.com/v3/paymentLinks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        value: params.value,
        billingType: "UNDEFINED",
        chargeType: "DETACHED",
        dueDateLimitDays: 7,
        externalReference: params.externalReference,
        notificationEnabled: true,
        subscriptionCycle: null,
        callback: {
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          autoRedirect: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Asaas payment link error:", errorText);
      return null;
    }

    const data = await response.json();
    return { url: data.url, id: data.id };
  } catch (error) {
    console.error("Asaas API error:", error);
    return null;
  }
}

export function registerBillingRoutes(app: Express) {
  app.get("/api/billing/plans", async (req, res) => {
    try {
      const plans = await storage.getBillingPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Erro ao buscar planos" });
    }
  });

  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const { planCode, couponCode, paymentMethod } = req.body;

      if (!planCode) {
        return res.status(400).json({ message: "Plano não informado" });
      }

      const plan = await storage.getBillingPlan(planCode);
      if (!plan) {
        return res.status(400).json({ message: "Plano não encontrado" });
      }

      let discountCents = 0;
      let validatedCoupon: string | null = null;

      if (couponCode) {
        const coupon = await storage.getPromoCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          const now = new Date();
          const isValid = (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
                         (!coupon.validUntil || new Date(coupon.validUntil) >= now) &&
                         (!coupon.maxUses || (coupon.currentUses || 0) < coupon.maxUses);
          
          if (isValid) {
            const discountVal = parseFloat(coupon.discountValue as string) || 0;
            if (coupon.discountType === "percentage") {
              discountCents = Math.floor(plan.priceCents * (discountVal / 100));
            } else {
              discountCents = Math.floor(discountVal * 100);
            }
            validatedCoupon = couponCode;
          }
        }
      }

      const finalPriceCents = Math.max(plan.priceCents - discountCents, 0);
      const finalPriceReais = finalPriceCents / 100;

      const order = await storage.createBillingOrder({
        userId,
        planCode,
        originalPriceCents: plan.priceCents,
        discountCents,
        finalPriceCents,
        couponCode: validatedCoupon,
        paymentMethod: paymentMethod || null,
        status: "pending"
      });

      const baseUrl = getPublishedDomain(req);
      const user = await authStorage.getUser(userId);

      const paymentLink = await createAsaasPaymentLink({
        name: `Salva Plantão - ${plan.name}`,
        description: `Assinatura ${plan.name} - ${plan.durationDays} dias`,
        value: finalPriceReais,
        externalReference: `${userId}|${order.id}`,
        successUrl: `${baseUrl}/billing/success?order=${order.id}`,
        cancelUrl: `${baseUrl}/billing/cancel?order=${order.id}`
      });

      if (!paymentLink) {
        await storage.updateBillingOrder(order.id, { status: "failed" });
        return res.status(500).json({ message: "Erro ao criar link de pagamento" });
      }

      await storage.updateBillingOrder(order.id, { 
        asaasPaymentId: paymentLink.id,
        asaasPaymentUrl: paymentLink.url,
        status: "processing"
      });

      res.json({ url: paymentLink.url, orderId: order.id });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Erro ao processar checkout" });
    }
  });

  app.get("/api/billing/status", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.role === "admin") {
        return res.json({
          status: "active",
          isAdmin: true,
          accessUntil: null,
          planCode: null
        });
      }

      const entitlement = await storage.getUserEntitlement(userId);
      
      if (!entitlement) {
        return res.json({
          status: "inactive",
          accessUntil: null,
          planCode: null
        });
      }

      const now = new Date();
      const isActive = entitlement.status === "active" && 
                       entitlement.accessUntil && 
                       new Date(entitlement.accessUntil) > now;

      res.json({
        status: isActive ? "active" : "expired",
        accessUntil: entitlement.accessUntil,
        planCode: entitlement.planCode
      });
    } catch (error) {
      console.error("Billing status error:", error);
      res.status(500).json({ message: "Erro ao verificar status" });
    }
  });

  app.get("/api/billing/orders", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const orders = await storage.getUserBillingOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.post("/api/webhooks/asaas", async (req, res) => {
    try {
      const { event, payment } = req.body;

      if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
        return res.json({ received: true });
      }

      const externalReference = payment?.externalReference;
      if (!externalReference) {
        console.warn("Webhook without externalReference");
        return res.json({ received: true });
      }

      const [userId, orderIdStr] = externalReference.split("|");
      const orderId = parseInt(orderIdStr);

      if (!userId || isNaN(orderId)) {
        console.warn("Invalid externalReference format:", externalReference);
        return res.json({ received: true });
      }

      const order = await storage.getBillingOrder(orderId);
      if (!order) {
        console.warn("Order not found:", orderId);
        return res.json({ received: true });
      }

      if (order.status === "paid") {
        return res.json({ received: true, message: "Already processed" });
      }

      await storage.updateBillingOrder(orderId, {
        status: "paid",
        paidAt: new Date()
      });

      const plan = await storage.getBillingPlan(order.planCode);
      if (plan) {
        await storage.activateUserEntitlement(userId, order.planCode, plan.durationDays, orderId);
        await authStorage.updateUserStatus(userId, "active");
      }

      if (order.couponCode) {
        const coupon = await storage.getPromoCouponByCode(order.couponCode);
        if (coupon) {
          await storage.updatePromoCoupon(coupon.id, {
            currentUses: (coupon.currentUses || 0) + 1
          } as any);
        }
      }

      console.log(`Payment confirmed for user ${userId}, order ${orderId}`);
      res.json({ received: true, activated: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });

  app.post("/api/billing/validate-coupon", async (req, res) => {
    try {
      const { couponCode, planCode } = req.body;

      if (!couponCode) {
        return res.status(400).json({ valid: false, message: "Código não informado" });
      }

      const coupon = await storage.getPromoCouponByCode(couponCode);
      if (!coupon || !coupon.isActive) {
        return res.json({ valid: false, message: "Cupom inválido" });
      }

      const now = new Date();
      if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        return res.json({ valid: false, message: "Cupom ainda não está ativo" });
      }
      if (coupon.validUntil && new Date(coupon.validUntil) < now) {
        return res.json({ valid: false, message: "Cupom expirado" });
      }
      if (coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses) {
        return res.json({ valid: false, message: "Cupom esgotado" });
      }

      let discountCents = 0;
      const discountVal = parseFloat(coupon.discountValue as string) || 0;
      if (planCode) {
        const plan = await storage.getBillingPlan(planCode);
        if (plan) {
          if (coupon.discountType === "percentage") {
            discountCents = Math.floor(plan.priceCents * (discountVal / 100));
          } else {
            discountCents = Math.floor(discountVal * 100);
          }
        }
      }

      res.json({
        valid: true,
        discountType: coupon.discountType,
        discountValue: discountVal,
        discountCents
      });
    } catch (error) {
      console.error("Coupon validation error:", error);
      res.status(500).json({ valid: false, message: "Erro ao validar cupom" });
    }
  });
}
