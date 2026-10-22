// 即现 App：启动页 → 登录 → 发现/详情/收藏/我的
const $ = (s) => document.querySelector(s)
const KEY_USER = 'jixian-app-user'
const KEY_SAVED = 'jixian-app-saved'

const user = () => JSON.parse(localStorage.getItem(KEY_USER) || 'null')
const saved = () => JSON.parse(localStorage.getItem(KEY_SAVED) || '{}')

let toastTimer
function toast(msg) {
  const t = $('#toast')
  t.textContent = msg
  t.classList.add('on')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('on'), 1600)
}

function screen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === name))
  if (name !== 'splash') {
    const sp = document.getElementById('splash')
    if (sp) sp.remove()
  }
}

/* ---------- 启动页 ---------- */
function splash() {
  screen('splash')
  let p = 0
  const bar = $('#splash .bar i')
  const tick = setInterval(() => {
    p += Math.random() * 22 + 8
    bar.style.width = Math.min(100, p) + '%'
    if (p >= 100) {
      clearInterval(tick)
      setTimeout(() => (user() ? enterApp() : screen('login')), 320)
    }
  }, 160)
}

/* ---------- 登录 ---------- */
let codeSent = false
let cooldown = 0

function sendCode() {
  const phone = $('#phone').value.trim()
  if (!/^1\d{10}$/.test(phone)) return showErr('请输入 11 位手机号')
  codeSent = true
  cooldown = 60
  const btn = $('#codeBtn')
  btn.disabled = true
  btn.textContent = cooldown + 's'
  showErr('')
  toast('验证码已发送（演示：任意 4 位数字）')
  const t = setInterval(() => {
    cooldown--
    btn.textContent = cooldown + 's'
    if (cooldown <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = '获取验证码' }
  }, 1000)
}

function showErr(msg) { $('#loginErr').textContent = msg }

function doLogin(kind) {
  const phone = $('#phone').value.trim()
  if (kind === 'phone') {
    if (!codeSent) return showErr('请先获取验证码')
    if (!/^\d{4}$/.test($('#code').value.trim())) return showErr('验证码是 4 位数字')
    if (!/^1\d{10}$/.test(phone)) return showErr('请输入 11 位手机号')
  }
  const name = kind === 'wechat' ? '微信用户' : '用户 ' + phone.slice(-4)
  localStorage.setItem(KEY_USER, JSON.stringify({ phone: phone || '138****8888', name, at: Date.now() }))
  toast('登录成功')
  enterApp()
}

function guest() {
  localStorage.setItem(KEY_USER, JSON.stringify({ phone: '', name: '游客', at: Date.now(), guest: true }))
  enterApp()
}

function logout() {
  localStorage.removeItem(KEY_USER)
  screen('login')
  $('#phone').value = ''
  $('#code').value = ''
  showErr('')
}

/* ---------- 主界面 ---------- */
let tab = 'discover'
let filter = 'all'
let keyword = ''

function enterApp() {
  screen('main')
  renderTabs()
  renderGrid()
  renderProfile()
}

function renderTabs() {
  const defs = [['all', '全部'], ['image', '图片'], ['motion', '视频动效'], ['web', '网页交互']]
  $('#tabs').innerHTML = defs
    .map(([k, n]) => `<button data-k="${k}" class="${k === filter ? 'on' : ''}">${n}</button>`)
    .join('')
  document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => { filter = b.dataset.k; renderTabs(); renderGrid() }))
}

const mediaLabel = { image: '图片', motion: '视频动效', web: '网页交互' }

function filtered() {
  const k = keyword.trim().toLowerCase()
  return CASES.filter((c) => {
    if (filter !== 'all' && c.media !== filter) return false
    if (!k) return true
    return [c.title, c.english, c.author, c.tag, c.summary].join(' ').toLowerCase().includes(k)
  })
}

function renderGrid() {
  const list = filtered()
  const s = saved()
  $('#count').textContent = list.length + ' 个案例'
  if (!list.length) {
    $('#grid').innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="sym">○</div>没有匹配的案例<br />换个关键词或筛选条件</div>`
    return
  }
  $('#grid').innerHTML = list
    .map(
      (c) => `
    <div class="card" data-id="${c.id}">
      <div class="thumb">
        <img src="${c.cover}" alt="${c.title}" loading="lazy" />
        <span class="badge">${mediaLabel[c.media]}</span>
        <button class="plus ${s[c.id] ? 'on' : ''}" data-save="${c.id}">${s[c.id] ? '★' : '+'}</button>
      </div>
      <div class="info">
        <h3>${c.title}</h3>
        <div class="by">${c.author}</div>
        <div class="tag">${c.tag}</div>
      </div>
    </div>`
    )
    .join('')
  document.querySelectorAll('.card .thumb img').forEach((img, i) => (img.onclick = () => openDetail(list[i].id)))
  document.querySelectorAll('[data-save]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); toggleSave(b.dataset.save) }))
}

function toggleSave(id) {
  const s = saved()
  if (s[id]) { delete s[id]; toast('已取消收藏') } else { s[id] = { note: '', savedAt: new Date().toISOString() }; toast('已收藏') }
  localStorage.setItem(KEY_SAVED, JSON.stringify(s))
  renderGrid()
  renderSaved()
}

function openDetail(id) {
  const c = CASES.find((x) => x.id === id)
  if (!c) return
  const s = saved()
  $('#dtitle').textContent = c.title
  $('#detailBody').innerHTML = `
    <div class="dcover"><img src="${c.cover.replace('-cover', '-cover')}" alt="${c.title}" /></div>
    <div class="dbody">
      <h2>${c.title}</h2>
      <div class="meta">${c.author} · ${mediaLabel[c.media]} · ${c.tag}</div>
      <p>${c.summary}</p>
      <h4>能拿到什么</h4>
      <div class="box">${c.delivery || '—'}<br /><span style="color:var(--muted)">${c.completeness || ''}</span></div>
      <h4>原始出处</h4>
      <div class="box" style="word-break:break-all">${c.source || '—'}</div>
      <h4>可跳转的资源</h4>
      ${(c.resources || []).map((r) => `<a class="linkrow" href="${r.url}" target="_blank" rel="noopener">${r.label}<span>${r.url.replace(/^https?:\/\//, '').slice(0, 46)}</span></a>`).join('') || '<div class="box">该案例未提供可跳转资源</div>'}
      <h4>输入 / 复跑状态</h4>
      <div class="box">${c.input || '—'}<br /><span style="color:var(--muted)">${c.verification || ''}</span></div>
      <h4>版权与许可</h4>
      <div class="box" style="color:var(--muted)">${c.rights || '—'}</div>
    </div>
    <div class="dactions">
      <button class="btn" id="openPrimary">${c.primary_label || '查看原始链接'}</button>
      <button class="btn save" id="saveBtn">${s[c.id] ? '★ 已收藏' : '☆ 收藏'}</button>
    </div>`
  $('#openPrimary').onclick = () => window.open(c.primary_url || (c.resources || [])[0]?.url || '#', '_blank', 'noopener')
  $('#saveBtn').onclick = () => { toggleSave(c.id); $('#saveBtn').textContent = saved()[c.id] ? '★ 已收藏' : '☆ 收藏' }
  $('#detail').classList.add('on')
}

function renderSaved() {
  const s = saved()
  const list = CASES.filter((c) => s[c.id])
  if (!list.length) {
    $('#savedList').innerHTML = `<div class="empty"><div class="sym">☆</div>还没有收藏<br />在发现页点卡片右上角的 +</div>`
    return
  }
  $('#savedList').innerHTML = list
    .map(
      (c) => `
    <div class="item" data-id="${c.id}">
      <img src="${c.cover}" alt="${c.title}" />
      <div>
        <h3>${c.title}</h3>
        <p>${c.author}</p>
        <p>${s[c.id].note || '暂无备注'}</p>
        <button class="rm" data-rm="${c.id}">移出收藏</button>
      </div>
    </div>`
    )
    .join('')
  document.querySelectorAll('.item img').forEach((img, i) => (img.onclick = () => openDetail(list[i].id)))
  document.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => toggleSave(b.dataset.rm)))
}

function renderProfile() {
  const u = user() || {}
  $('#pname').textContent = u.name || '未登录'
  $('#pphone').textContent = u.phone ? u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定手机号'
  const s = saved()
  $('#psaved').textContent = Object.keys(s).length + ' 个'
  $('#pall').textContent = CASES.length + ' 个'
}

function switchTab(name) {
  tab = name
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name))
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.id === 'page-' + name))
  if (name === 'saved') renderSaved()
  if (name === 'me') renderProfile()
}

/* ---------- 事件绑定 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  $('#codeBtn').onclick = sendCode
  $('#loginBtn').onclick = () => doLogin('phone')
  $('#wechatBtn').onclick = () => doLogin('wechat')
  $('#guestBtn').onclick = guest
  $('#backBtn').onclick = () => $('#detail').classList.remove('on')
  $('#search').oninput = (e) => { keyword = e.target.value; renderGrid() }
  document.querySelectorAll('#tabbar button').forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)))
  $('#logoutBtn').onclick = logout
  $('#aboutBtn').onclick = () => toast('即现 v1.0 · 来源画廊 App 版')
  splash()
})
