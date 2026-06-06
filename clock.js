(function () {

  /* ── 눈금 & 숫자 생성 ── */
  const ticksG = document.getElementById('ticks');
  const numsG  = document.getElementById('nums');

  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const major = i % 5 === 0;
    const r1 = major ? 88 : 95;
    const r2 = 100;

    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', 110 + r1 * Math.cos(angle));
    ln.setAttribute('y1', 110 + r1 * Math.sin(angle));
    ln.setAttribute('x2', 110 + r2 * Math.cos(angle));
    ln.setAttribute('y2', 110 + r2 * Math.sin(angle));
    ln.setAttribute('stroke', major ? '#1a1a1a' : '#ccc');
    ln.setAttribute('stroke-width', major ? '2' : '0.8');
    ticksG.appendChild(ln);

    if (major) {
      const num = i === 0 ? 12 : i / 5;
      const rn  = 76;
      const tx  = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tx.setAttribute('x', 110 + rn * Math.cos(angle));
      tx.setAttribute('y', 110 + rn * Math.sin(angle));
      tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('dominant-baseline', 'central');
      tx.setAttribute('font-size', '13');
      tx.setAttribute('font-weight', '500');
      tx.setAttribute('fill', '#1a1a1a');
      tx.textContent = num;
      numsG.appendChild(tx);
    }
  }

  /* ── DOM 참조 ── */
  const hourHand    = document.getElementById('hourHand');
  const minHand     = document.getElementById('minHand');
  const inputH      = document.getElementById('inputH');
  const inputM      = document.getElementById('inputM');
  const timeDisplay = document.getElementById('timeDisplay');

  /* ── 각도 계산 ── */

  /**
   * 목표 각도(rawTarget)로 이동할 때
   * 현재 누적 각도(current) 기준 ±180° 이내 최단 경로를 반환한다.
   * 이렇게 하면 CSS transition의 한 바퀴 역회전 문제가 발생하지 않는다.
   */
  function nearestDeg(current, rawTarget) {
    const diff = ((rawTarget - current) % 360 + 540) % 360 - 180;
    return current + diff;
  }

  /** 총 분(0~1439) → 시침·분침의 0~360° 원시 각도 */
  function calcRawDeg(totalMins) {
    const h = Math.floor(totalMins / 60) % 12;
    const m = totalMins % 60;
    return {
      hour: h * 30 + m * 0.5,
      min:  m * 6,
    };
  }

  /* ── 애니메이션 상태 ── */
  let currentHourDeg = 0; // DOM에 실제 적용 중인 누적 각도
  let currentMinDeg  = 0;
  let targetHourDeg  = 0; // 이동 목표 누적 각도
  let targetMinDeg   = 0;
  let animId         = null;

  const LERP_SPEED = 0.12; // 보간 속도 (0~1, 클수록 빠름)

  function applyHands() {
    hourHand.setAttribute('transform', `rotate(${currentHourDeg}, 110, 110)`);
    minHand.setAttribute('transform',  `rotate(${currentMinDeg},  110, 110)`);
  }

  function animate() {
    const dh = targetHourDeg - currentHourDeg;
    const dm = targetMinDeg  - currentMinDeg;

    if (Math.abs(dh) < 0.01 && Math.abs(dm) < 0.01) {
      currentHourDeg = targetHourDeg;
      currentMinDeg  = targetMinDeg;
      applyHands();
      animId = null;
      return;
    }

    currentHourDeg += dh * LERP_SPEED;
    currentMinDeg  += dm * LERP_SPEED;
    applyHands();
    animId = requestAnimationFrame(animate);
  }

  /** 목표 각도를 갱신하고 애니메이션을 시작한다 */
  function animateTo(newTotalMins) {
    const raw = calcRawDeg(newTotalMins);
    targetHourDeg = nearestDeg(targetHourDeg, raw.hour);
    targetMinDeg  = nearestDeg(targetMinDeg,  raw.min);
    if (animId) cancelAnimationFrame(animId);
    animate();
  }

  /* ── 상태 ── */
  let totalMins = 10 * 60 + 10; // 초기값 10:10

  /* ── 유틸 ── */
  function pad(n) { return String(n).padStart(2, '0'); }

  function formatDisplay(tm) {
    const h    = Math.floor(tm / 60) % 24;
    const m    = tm % 60;
    const ampm = h < 12 ? '오전' : '오후';
    const h12  = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${h12}:${pad(m)}`;
  }

  function updateUI() {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    inputH.value = pad(h);
    inputM.value = pad(m);
    timeDisplay.textContent = formatDisplay(totalMins);
  }

  function setTime(newTotalMins) {
    totalMins = ((newTotalMins % 1440) + 1440) % 1440;
    updateUI();
    animateTo(totalMins);
  }

  /* ── 이벤트 ── */
  document.getElementById('btnMinus').addEventListener('click', () => setTime(totalMins - 5));
  document.getElementById('btnPlus').addEventListener('click',  () => setTime(totalMins + 5));

  function onInput() {
    let h = parseInt(inputH.value, 10);
    let m = parseInt(inputM.value, 10);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    totalMins = h * 60 + m;
    timeDisplay.textContent = formatDisplay(totalMins);
    animateTo(totalMins);
  }

  inputH.addEventListener('input', onInput);
  inputM.addEventListener('input', onInput);

  inputH.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { setTime(totalMins + 60); e.preventDefault(); }
    if (e.key === 'ArrowDown') { setTime(totalMins - 60); e.preventDefault(); }
  });

  inputM.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { setTime(totalMins + 1); e.preventDefault(); }
    if (e.key === 'ArrowDown') { setTime(totalMins - 1); e.preventDefault(); }
  });

  /* ── 초기 렌더 (애니메이션 없이 즉시) ── */
  const initRaw = calcRawDeg(totalMins);
  currentHourDeg = targetHourDeg = initRaw.hour;
  currentMinDeg  = targetMinDeg  = initRaw.min;
  applyHands();
  updateUI();

})();
