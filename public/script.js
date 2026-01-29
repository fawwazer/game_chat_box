const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// helper to create rows
function createRow(sender){
  const row = document.createElement('div');
  row.className = 'message-row ' + sender;
  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + sender;
  avatar.textContent = sender === 'user' ? 'YOU' : 'AI';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  row.appendChild(sender==='user'? bubble : avatar);
  row.appendChild(sender==='user'? avatar : bubble);
  return {row, bubble};
}

function appendMessage(sender, content, isHTML=false){
  const {row, bubble} = createRow(sender);
  if(isHTML) bubble.innerHTML = content;
  else bubble.textContent = content;
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendTyping(){
  const {row, bubble} = createRow('bot');
  bubble.classList.add('typing');
  bubble.textContent = 'AI sedang mengetik...';
  row.dataset.typing = '1';
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping(){
  const el = chatBox.querySelector('[data-typing]');
  if(el) el.remove();
}

form.addEventListener('submit', async function(e){
  e.preventDefault();
  const userMessage = input.value.trim();
  if(!userMessage) return;
  appendMessage('user', userMessage);
  input.value = '';

  // show typing
  appendTyping();

  // send to backend
  try{
    const resp = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ conversation: [{ role: 'user', content: userMessage }] })
    });

    removeTyping();

    if(!resp.ok){
      const text = await resp.text();
      appendMessage('bot', 'Terjadi kesalahan: ' + text);
      return;
    }

    const data = await resp.json();
    const result = data.result || data.message || 'Tidak ada respons dari server.';

    // If the server returns structured HTML or markdown, render as HTML
    appendMessage('bot', result, true);
  }catch(err){
    removeTyping();
    // fallback recommendations if backend unavailable
    const fallback = `
      <div class="game-card">
        <div class="game-thumb">SL</div>
        <div class="game-meta">
          <div class="game-title">Stardew Valley</div>
          <div class="game-desc">Cozy farming RPG, cocok untuk pemain yang suka relaks dan eksplorasi.</div>
          <div class="game-tags"><span class="tag">PC</span><span class="tag">Single-player</span><span class="tag">Under $20</span></div>
        </div>
      </div>
      <div style="height:8px"></div>
      <div class="game-card">
        <div class="game-thumb">HT</div>
        <div class="game-meta">
          <div class="game-title">Hades</div>
          <div class="game-desc">Rogue-like action yang intens dengan cerita dan replayability tinggi.</div>
          <div class="game-tags"><span class="tag">PC</span><span class="tag">Action</span><span class="tag">Highly Rated</span></div>
        </div>
      </div>
    `;
    appendMessage('bot', fallback, true);
  }
});
