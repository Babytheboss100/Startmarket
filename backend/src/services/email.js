const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'noreply@startmarket.no';
const FE = process.env.FRONTEND_URL || 'https://startmarket.no';

const btn = (url, text) => `<a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-top:16px">${text}</a>`;

async function sendBidNotification(sellerEmail, listing, bid, buyer) {
  const total = (Number(bid.pricePerShare) * bid.sharesWanted).toLocaleString('nb-NO');
  await resend.emails.send({
    from: FROM, to: sellerEmail,
    subject: `Nytt bud – ${listing.company?.name}`,
    html: `<h2 style="color:#0f172a">Du har mottatt et nytt bud</h2>
      <p><b>Kjøper:</b> ${buyer.fullName}</p>
      <p><b>Pris/aksje:</b> NOK ${Number(bid.pricePerShare).toLocaleString('nb-NO')}</p>
      <p><b>Antall:</b> ${bid.sharesWanted.toLocaleString('nb-NO')} aksjer</p>
      <p><b>Total:</b> NOK ${total}</p>
      ${bid.message ? `<p><b>Melding:</b> ${bid.message}</p>` : ''}
      ${btn(`${FE}/listings/${listing.id}`, 'Se budet')}`
  });
}

async function sendDealRoomCreated(buyerEmail, dealRoom) {
  await resend.emails.send({
    from: FROM, to: buyerEmail,
    subject: 'Budet ditt er akseptert – Deal Room opprettet',
    html: `<h2 style="color:#0f172a">Budet ditt er akseptert!</h2>
      <p>Et Deal Room er opprettet. Neste steg: signer NDA for å få tilgang til due diligence-dokumenter.</p>
      ${btn(`${FE}/dealrooms/${dealRoom.id}`, 'Gå til Deal Room')}`
  });
}

async function sendWelcome(email, fullName) {
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Velkommen til StartMarket',
    html: `<h2 style="color:#0f172a">Velkommen, ${fullName}!</h2>
      <p>Din konto er opprettet. Fullfør KYC-verifisering for å begynne å handle.</p>
      ${btn(`${FE}/profile`, 'Kom i gang')}`
  });
}

module.exports = { sendBidNotification, sendDealRoomCreated, sendWelcome };
