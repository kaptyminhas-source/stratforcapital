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

    if (honeypot) return Response.redirect(new URL("/thank-you", request.url), 303);
    if (!name || !email) {
      return new Response("Missing required fields", { status: 400 });
    }

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