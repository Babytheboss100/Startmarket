'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';
import { getUser } from '../../../lib/auth';

const STAGES = ['NDA_PENDING', 'DD_ACTIVE', 'NEGOTIATING', 'SIGNING', 'COMPLETED'];
const STAGE_LABELS = { NDA_PENDING: 'NDA', DD_ACTIVE: 'Due Diligence', NEGOTIATING: 'Forhandling', SIGNING: 'Signering', COMPLETED: 'Fullført' };

export default function DealRoomPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const user = getUser();

  const fetchRoom = () => {
    api.get(`/api/dealrooms/${id}`).then(r => { setRoom(r.data); setLoading(false); }).catch(console.error);
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/dealrooms/${id}/messages`, { content: message });
      setMessage('');
      fetchRoom();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const signNda = async () => {
    try {
      await api.post(`/api/dealrooms/${id}/nda`);
      fetchRoom();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Laster Deal Room...</div></>;
  if (!room) return <><Navbar /><div className="container" style={{ padding: 40, textAlign: 'center' }}>Deal Room ikke funnet</div></>;

  const currentStageIdx = STAGES.indexOf(room.stage);
  const myMember = room.members?.find(m => m.userId === user?.id);

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left - Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            Deal Room &ndash; {room.listing?.company?.name}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
            {room.members?.map(m => m.user?.fullName).join(' & ')}
          </p>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {room.messages?.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40, fontSize: 14 }}>Ingen meldinger ennå. Si hei!</p>
            )}
            {room.messages?.map(msg => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isMine ? 'var(--accent)' : 'var(--gray-100)',
                    color: isMine ? 'white' : 'var(--gray-900)',
                    fontSize: 14
                  }}>
                    {!isMine && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, opacity: 0.7 }}>{msg.sender?.fullName}</div>}
                    <div>{msg.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.sentAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Skriv en melding..." value={message} onChange={e => setMessage(e.target.value)} />
            <button className="btn btn-primary" disabled={sending || !message.trim()}>Send</button>
          </form>
        </div>

        {/* Right - Info */}
        <div>
          {/* Stage tracker */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Fremdrift</h3>
            {STAGES.map((stage, idx) => (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: idx <= currentStageIdx ? 'var(--accent)' : 'var(--gray-200)',
                  color: idx <= currentStageIdx ? 'white' : 'var(--gray-600)'
                }}>{idx + 1}</div>
                <span style={{ fontSize: 13, fontWeight: idx === currentStageIdx ? 600 : 400, color: idx <= currentStageIdx ? 'var(--gray-900)' : 'var(--gray-400)' }}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            ))}
          </div>

          {/* NDA signing */}
          {room.stage === 'NDA_PENDING' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>NDA-signering</h3>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                Selger: <span className={`badge ${room.ndaSignedSeller ? 'badge-verified' : 'badge-pending'}`}>{room.ndaSignedSeller ? 'Signert' : 'Venter'}</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                Kjøper: <span className={`badge ${room.ndaSignedBuyer ? 'badge-verified' : 'badge-pending'}`}>{room.ndaSignedBuyer ? 'Signert' : 'Venter'}</span>
              </div>
              {myMember && !(
                (myMember.role === 'SELLER' && room.ndaSignedSeller) ||
                (myMember.role === 'BUYER' && room.ndaSignedBuyer)
              ) && (
                <button className="btn btn-primary btn-full btn-sm" onClick={signNda}>Signer NDA</button>
              )}
            </div>
          )}

          {/* Transaction info */}
          {room.acceptedBid && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Transaksjon</h3>
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                <div style={{ marginBottom: 4 }}>Pris/aksje: <b>NOK {Number(room.acceptedBid.pricePerShare).toLocaleString('nb-NO')}</b></div>
                <div style={{ marginBottom: 4 }}>Antall: <b>{room.acceptedBid.sharesWanted.toLocaleString('nb-NO')}</b></div>
                <div>Total: <b>NOK {(Number(room.acceptedBid.pricePerShare) * room.acceptedBid.sharesWanted).toLocaleString('nb-NO')}</b></div>
              </div>
            </div>
          )}

          {/* Documents */}
          {room.documents?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Dokumenter</h3>
              {room.documents.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                  <span>{d.fileName}</span>
                  <span className={`badge ${d.signed ? 'badge-verified' : 'badge-draft'}`}>{d.signed ? 'Signert' : d.docType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
