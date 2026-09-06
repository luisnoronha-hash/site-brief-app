import type { Locale } from "@prisma/client";
import { appUrl } from "@/lib/app-url";

type Templated = { subject: string; body: string };


function wrap(locale: Locale, title: string, lines: string[]): string {
  const closing =
    locale === "pt"
      ? "Atenciosamente,<br/>Equipe Site Brief"
      : "Best regards,<br/>The Site Brief Team";
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; color:#1B2A41; max-width:560px; margin:0 auto; padding:32px 24px;">
      <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#5B5F66; margin-bottom:24px;">Site Brief</div>
      <h1 style="font-size:20px; font-weight:600; margin-bottom:16px;">${title}</h1>
      ${lines.map((l) => `<p style="font-size:15px; line-height:1.6; color:#33363B;">${l}</p>`).join("\n")}
      <p style="font-size:15px; line-height:1.6; margin-top:32px;">${closing}</p>
      <hr style="border:none; border-top:1px solid #EDE9DF; margin:32px 0 16px;" />
      <p style="font-size:12px; color:#8A8E94;">site-brief.com</p>
    </div>
  `;
}

export function verificationEmail(locale: Locale, token: string): Templated {
  const link = `${appUrl()}/verify?token=${token}`;
  if (locale === "pt") {
    return {
      subject: "Confirme seu endereço de e-mail — Site Brief",
      body: wrap(locale, "Confirme seu e-mail", [
        `Obrigado por se cadastrar no Site Brief. Confirme seu e-mail para enviar sua primeira análise.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Confirmar e-mail</a>`,
      ]),
    };
  }
  return {
    subject: "Confirm your email — Site Brief",
    body: wrap(locale, "Confirm your email", [
      `Thanks for signing up for Site Brief. Confirm your email to submit your first analysis.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">Confirm email</a>`,
    ]),
  };
}

export function passwordResetEmail(locale: Locale, token: string): Templated {
  const link = `${appUrl()}/reset-password?token=${token}`;
  if (locale === "pt") {
    return {
      subject: "Redefinir sua senha — Site Brief",
      body: wrap(locale, "Redefinir senha", [
        `Recebemos uma solicitação para redefinir sua senha. Se não foi você, ignore este e-mail.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Redefinir senha</a>`,
      ]),
    };
  }
  return {
    subject: "Reset your password — Site Brief",
    body: wrap(locale, "Reset your password", [
      `We received a request to reset your password. If this wasn't you, you can safely ignore this email.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">Reset password</a>`,
    ]),
  };
}

export function orderReceivedEmail(locale: Locale, address: string): Templated {
  const link = `${appUrl()}/dashboard`;
  if (locale === "pt") {
    return {
      subject: `Recebemos seu pedido — ${address}`,
      body: wrap(locale, "Pedido recebido", [
        `Recebemos seu pedido de análise de potencial de desenvolvimento para <strong>${address}</strong>.`,
        `Nossa equipe iniciará a preparação da análise. Você será notificado assim que o relatório estiver pronto.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Ver painel</a>`,
      ]),
    };
  }
  return {
    subject: `We've received your order — ${address}`,
    body: wrap(locale, "Order received", [
      `We've received your development-potential analysis order for <strong>${address}</strong>.`,
      `Our team will begin preparing the analysis. You'll be notified as soon as the report is ready.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">View dashboard</a>`,
    ]),
  };
}

export function orderInProgressEmail(locale: Locale, address: string): Templated {
  if (locale === "pt") {
    return {
      subject: `Sua análise está em andamento — ${address}`,
      body: wrap(locale, "Análise em andamento", [
        `Nossa equipe está preparando a análise de potencial de desenvolvimento para <strong>${address}</strong>.`,
      ]),
    };
  }
  return {
    subject: `Your analysis is in progress — ${address}`,
    body: wrap(locale, "Analysis in progress", [
      `Our team is now preparing the development-potential analysis for <strong>${address}</strong>.`,
    ]),
  };
}

export function reportDeliveredEmail(locale: Locale, address: string): Templated {
  const link = `${appUrl()}/dashboard`;
  if (locale === "pt") {
    return {
      subject: `Seu relatório está pronto — ${address}`,
      body: wrap(locale, "Relatório pronto", [
        `Sua análise de potencial de desenvolvimento para <strong>${address}</strong> está pronta para download.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Baixar relatório</a>`,
      ]),
    };
  }
  return {
    subject: `Your report is ready — ${address}`,
    body: wrap(locale, "Report delivered", [
      `Your development-potential analysis for <strong>${address}</strong> is ready to download.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">Download report</a>`,
    ]),
  };
}

export function paymentSucceededEmail(locale: Locale, amountLabel: string): Templated {
  if (locale === "pt") {
    return {
      subject: "Pagamento confirmado — Site Brief",
      body: wrap(locale, "Pagamento confirmado", [`Recebemos seu pagamento de ${amountLabel}. Obrigado.`]),
    };
  }
  return {
    subject: "Payment confirmed — Site Brief",
    body: wrap(locale, "Payment confirmed", [`We've received your payment of ${amountLabel}. Thank you.`]),
  };
}

export function paymentFailedEmail(locale: Locale): Templated {
  const link = `${appUrl()}/dashboard/billing`;
  if (locale === "pt") {
    return {
      subject: "Falha no pagamento — Site Brief",
      body: wrap(locale, "Falha no pagamento", [
        `Não foi possível processar seu pagamento. Atualize seu método de pagamento para continuar.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Atualizar pagamento</a>`,
      ]),
    };
  }
  return {
    subject: "Payment failed — Site Brief",
    body: wrap(locale, "Payment failed", [
      `We weren't able to process your payment. Please update your payment method to continue.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">Update payment method</a>`,
    ]),
  };
}

export function subscriptionCancelledEmail(locale: Locale): Templated {
  if (locale === "pt") {
    return {
      subject: "Assinatura cancelada — Site Brief",
      body: wrap(locale, "Assinatura cancelada", [
        `Sua assinatura foi cancelada e permanecerá ativa até o fim do período atual já pago.`,
      ]),
    };
  }
  return {
    subject: "Subscription cancelled — Site Brief",
    body: wrap(locale, "Subscription cancelled", [
      `Your subscription has been cancelled and will remain active through the end of the current paid period.`,
    ]),
  };
}

export function freeAnalysesExhaustedEmail(locale: Locale): Templated {
  const link = `${appUrl()}/dashboard/billing`;
  if (locale === "pt") {
    return {
      subject: "Suas análises gratuitas terminaram — Site Brief",
      body: wrap(locale, "Análises gratuitas esgotadas", [
        `Você utilizou suas análises gratuitas. Assine por US$99/mês ou compre uma análise avulsa por US$250.`,
        `<a href="${link}" style="color:#1B2A41; font-weight:600;">Ver opções</a>`,
      ]),
    };
  }
  return {
    subject: "Your free analyses are used up — Site Brief",
    body: wrap(locale, "Free analyses exhausted", [
      `You've used all of your free analyses. Subscribe for $99/month or purchase a single analysis for $250.`,
      `<a href="${link}" style="color:#1B2A41; font-weight:600;">View options</a>`,
    ]),
  };
}

export function orderReceivedAdminNotice(address: string, agentEmail: string): Templated {
  return {
    subject: `New order — ${address}`,
    body: wrap("en" as Locale, "New order submitted", [
      `${agentEmail} submitted a new order for <strong>${address}</strong>.`,
      `<a href="${appUrl()}/admin" style="color:#1B2A41; font-weight:600;">Open admin queue</a>`,
    ]),
  };
}
