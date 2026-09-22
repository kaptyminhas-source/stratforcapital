export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();
    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const phone = (form.get("phone") || "").toString().trim();
    const location = (form.get("location") || "").toString().trim();
    const amount = (form.get("amount") || "").toString().trim();
    const description = (form.get("description") || "").toString().trim();
    const honeypot = (form.get("website_url") || "").toString().trim();
    const formTs = Number((form.get("form_ts") || "0").toString());
    const serviceInterest = (form.get("service_interest") || "").toString().trim();
    const utmSource = (form.get("utm_source") || "").toString().trim();
    const utmMedium = (form.get("utm_medium") || "").toString().trim();
    const utmCampaign = (form.get("utm_campaign") || "").toString().trim();

    const silentOk = () => Response.redirect(new URL("/thank-you", request.url), 303);

    // Honeypot: hidden field, only bots fill it
    if (honeypot) return silentOk();

    // Time trap: real users take more than 3 seconds to fill the form
    if (!formTs || Date.now() - formTs < 3000) return silentOk();

    // Reserved fictional phone numbers (NXX-555-0100 through NXX-555-0199)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length >= 7 && /^5550(0|1)\d{2}$/.test(phoneDigits.slice(-7))) return silentOk();

    // Common spam / subscription-bot phrases and bare URLs
    const spamPattern = /(confirm my subscription|unsubscribe|newsletter|seo servic|backlink|guest post|link building|crypto|bitcoin|forex|https?:\/\/|www\.)/i;
    if (spamPattern.test(description) || spamPattern.test(name)) return silentOk();

    if (!name || !email) {
      return new Response("Missing required fields", { status: 400 });
    }

    const source = [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / ") || "Direct (no campaign tag)";

    const subject = `New lending inquiry — ${name}`;
    const html = `
      <h2>New Stratfor Capital Inquiry</h2>
      <p><strong>Name:</strong> ${escape(name)}</p>
      <p><strong>Email:</strong> ${escape(email)}</p>
      <p><strong>Phone:</strong> ${escape(phone)}</p>
      <p><strong>Property Location:</strong> ${escape(location)}</p>
      <p><strong>Estimated Loan Amount:</strong> ${escape(amount)}</p>
      <p><strong>Description:</strong></p>
      <p>${escape(description).replace(/\n/g, "<br>")}</p>
      <hr>
      <p><strong>Page:</strong> ${escape(serviceInterest || "General inquiry")}</p>
      <p><strong>Campaign Source:</strong> ${escape(source)}</p>
      <p style="color:#888;font-size:12px">Submitted via stratforcapital.com contact form</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Stratfor Capital <forms@stratforcapital.com>",
        to: ["kaptyminhas@gmail.com"],
        reply_to: email,
        subject,
        html
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("Resend error:", err);
      return new Response("Failed to send", { status: 500 });
    }

    return Response.redirect(new URL("/thank-you", request.url), 303);
  } catch (e) {
    console.log("Function error:", e.message);
    return new Response("Server error", { status: 500 });
  }
}

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
