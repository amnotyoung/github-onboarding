import { STEPS, COMMITS, getState, visibleNode } from './lab-model.mjs';
import { newMission, transitionMission, missionLesson, missionScene, missionCommits, missionNodeVisible, missionGroup, missionInteraction, missionTimeline, checkpointLabel, DRAFTS } from './mission-model.mjs';
import { createMissionUI } from './mission-ui.mjs';
import { createCollaborationMap } from './collaboration-map.mjs';

const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const initialStep = Number(new URLSearchParams(location.hash.slice(1)).get('step') || 0);
let step = getState(initialStep).step, positions = {}, selected = STEPS[step].selected;
let sceneAPI = null, stepPending = false, toastTimer;
let mode = new URLSearchParams(location.search).get('mode') === 'flow' ? 'flow' : 'mission', mission = newMission();
let arrange = mode === 'flow';
const lessonNow = () => mode === 'mission' ? missionLesson(mission) : STEPS[step];
const stateNow = () => mode === 'mission' ? missionScene(mission) : getState(step);
const commitsNow = () => mode === 'mission' ? missionCommits(mission) : COMMITS;
const nodeVisible = key => mode === 'mission' ? missionNodeVisible(key, mission) : visibleNode(key, step);
const snapshotHome = $('#snapshot-details').parentElement, technicalHome = $('.technical-details').parentElement;
$('#activity-body').append($('#mission-actions'), $('#mission-message'));
$('#extra-tools-body').append($('#mission-progress'));
const selectCommit = key => {
  selected = key; $('#snapshot-details').open = true; renderSnapshot();
  if (mode === 'mission' && !$('#record-dialog').open) $('#record-dialog').showModal();
};
const missionUI = createMissionUI({ dispatch: missionAction, getContext: () => ({ mission }), selectCommit, showMessage: message => { $('#mission-message').textContent = message; } });
const collaborationMap = createCollaborationMap({getContext:()=>({mission,selected}),activate:activateScene,selectCommit,canInteract});

function canInteract() { return true; }
async function activateScene() {
  if (!canInteract() || stepPending) return;
  const interaction = missionInteraction(mission);
  if (interaction.kind === 'compare') { selectCommit('local:M'); return; }
  if (interaction.kind === 'edit' || (interaction.kind === 'review' && mission.phase === 'reposted')) { $('#activity-dialog').showModal(); return; }
  if (interaction.kind === 'review') {
    await missionAction({ kind: 'request-changes', issue: DRAFTS[mission.draft].issue });
    if (mission.phase === 'changes') $('#activity-dialog').showModal(); return;
  }
  await missionAction({ kind: interaction.kind });
}
function afterMissionChange(previousPhase) {
  if (mission.phase !== previousPhase) { $('#activity-dialog').close(); $('#record-dialog').close(); }
}

async function missionAction(action) {
  if (stepPending) return; stepPending = true;
  try {
    const previousPhase = mission.phase;
    const hadFuture = (mission.future || []).length > 0;
    mission = transitionMission(mission, action, { id: 'solo-author', name: '나' }, { solo: true });
    afterMissionChange(previousPhase);
    if (['restart', 'navigate'].includes(action.kind)) positions = {};
    selected = lessonNow().selected; sceneAPI?.rebuild(action.kind !== 'navigate'); renderStep();
    if (!['navigate', 'restart', 'request-changes'].includes(action.kind) && !mission.experiment) {
      const next = $('#collaboration-map .map-primary');
      next?.focus({ preventScroll: true });
      if (next) {
        const rect = next.getBoundingClientRect();
        if (rect.top < 12 || rect.bottom > innerHeight - 12) next.closest('.map-repo').scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
    }
    if (hadFuture && !mission.future.length && !mission.navigation && action.kind !== 'restart') toast('이 장면부터 이후 기록·리뷰·승인을 다시 진행합니다.');
  } catch (error) { $('#mission-message').textContent = error.message; if (!$('#activity-dialog').open) toast(error.message); }
  finally { stepPending = false; }
}
async function changeMode(nextMode) {
  if (mode === nextMode) return;
  mode = nextMode; positions = {}; arrange = mode === 'flow'; selected = lessonNow().selected;
  $('#snapshot-details').open = mode === 'flow'; sceneAPI?.rebuild(); renderStep(); if(mode==='flow')ensureScene();
}

function toast(message) { $('#toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 3500); }
function renderSnapshot() {
  if (!nodeVisible(selected)) selected = lessonNow().selected;
  const [repo, id] = selected.split(':'), commit = commitsNow()[id];
  $('#selected-label').textContent = `${repo === 'local' ? '나의 로컬 저장소' : repo === 'peer' ? '동료의 로컬 저장소' : 'GitHub 공유 저장소'} · 선택한 기록`;
  $('#snapshot-id').textContent = `${id} / ${commit.hash}`;
  $('#snapshot-title').textContent = commit.title;
  $('#file-content').replaceChildren(...commit.lines.map((line, i) => {
    const span = document.createElement('span'); span.textContent = `${i + 1}  ${line}`;
    if (i >= 2) span.className = 'added'; return span;
  }));
  $('#snapshot-parents').textContent = commit.parents.length ? `부모 기록: ${commit.parents.join(' + ')}${id === 'M' ? ' · 두 이력을 연결한 병합 커밋' : ''}` : '부모 기록 없음 · 첫 커밋';
  sceneAPI?.select(selected);
  collaborationMap.select(selected);
}
function renderStep() {
  const lesson = lessonNow(), state = stateNow();
  document.body.dataset.learningMode = mode;
  $('#action-focus').hidden = mode !== 'mission'; $('#extra-tools').hidden = mode !== 'mission';
  $('#mission-observation').hidden = mode !== 'mission'; $('#experiments-details').hidden = mode !== 'mission'; $('#experiment-result').hidden = mode !== 'mission';
  (mode === 'mission' ? $('#record-body') : snapshotHome).append($('#snapshot-details'));
  (mode === 'mission' ? $('#extra-tools-body') : technicalHome).append($('.technical-details'));
  $('.scene-title').textContent = mode === 'mission' ? '팀 동화책 실험 공간' : 'our-team / handbook';
  $('#step-count').textContent = mode === 'mission' ? `MISSION ${missionGroup(mission) + 1} / 7` : `${String(step + 1).padStart(2, '0')} / 10`;
  $('#step-rail').hidden = mode === 'mission'; $('#mission-area').hidden = mode !== 'mission'; $('#mission-toolbar').hidden = mode !== 'mission';
  $('.step-actions').hidden = mode === 'mission'; $('#mission-actions').hidden = mode !== 'mission'; $('#mission-message').hidden = mode !== 'mission';
  $('#mode-mission').setAttribute('aria-pressed', String(mode === 'mission')); $('#mode-flow').setAttribute('aria-pressed', String(mode === 'flow'));
  $('#arrange-toggle').checked = arrange;
  $('#step-location').textContent = lesson.location;
  $('#step-title').textContent = lesson.title; $('#step-body').textContent = lesson.body;
  $('#takeaway').textContent = lesson.takeaway; $('#command').textContent = lesson.command;
  $('#next').textContent = lesson.action || ''; $('#previous').disabled = step === 0;
  $('#local-status').textContent = state.local.main ? `main → ${state.local.main}${state.local.branch ? ` · story → ${state.local.branch}` : ''}` : '아직 복제 전';
  $('#remote-status').textContent = `main → ${state.remote.main}${state.remote.branch ? ` · story → ${state.remote.branch}` : ''}`;
  $('#quiz').hidden = !lesson.quiz; $('#quiz-question').textContent = lesson.quiz || ''; $('#quiz-feedback').textContent = '';
  document.querySelectorAll('[data-step]').forEach(button => {
    const value = Number(button.dataset.step); button.classList.toggle('visited', value < step);
    if (value === step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  const url = new URL(location.href); mode === 'flow' ? url.searchParams.set('mode', 'flow') : url.searchParams.delete('mode'); url.hash = mode === 'flow' ? `step=${step}` : `mission=${mission.phase}`;
  history.replaceState(null, '', url);
  if (mode === 'mission') missionUI.render();
  if (mode === 'mission') { collaborationMap.render(); document.body.dataset.sceneBusy='false'; }
  $('#collaboration-map').hidden = mode !== 'mission';
  renderNavigation();
  renderSnapshot();
  $('#shared-note').textContent = '지수는 정해진 시나리오로 작업하고 리뷰하는 가상 동료입니다. 실제 GitHub 저장소를 변경하지 않습니다.';
}
function renderNavigation() {
  $('#scene-navigation').hidden = mode !== 'mission';
  $('#scene-navigation').dataset.context = mission.experiment ? 'experiment' : mission.future?.length ? 'history' : 'current';
  const visited = missionTimeline(mission), index = (mission.history || []).length;
  const blocked = Boolean(mission.experiment);
  $('#scene-back').disabled = blocked || index === 0;
  $('#scene-forward').disabled = blocked || !(mission.future || []).length;
  $('#scene-jump').disabled = blocked || visited.length < 2;
  $('#scene-jump').replaceChildren(...visited.map((item, i) => { const option = document.createElement('option'); option.value = i; option.textContent = `${String(i + 1).padStart(2, '0')} · ${checkpointLabel(item)}`; return option; }));
  $('#scene-jump').value = index;
  $('#navigation-note').textContent = mission.experiment ? '실험을 되돌린 뒤 이전 장면으로 이동할 수 있어요.' : (mission.future || []).length ? '이전 장면 · 선택을 바꾸면 뒤의 리뷰·승인을 다시 진행해요.' : '지나온 장면을 다시 보고, 다른 선택도 해볼 수 있어요.';
  $('#dialog-back').hidden = mode !== 'mission'; $('#dialog-back').disabled = blocked || index === 0;
}
function setStep(next, animate = true) {
  const previous = step; step = getState(next).step; selected = STEPS[step].selected;
  sceneAPI?.rebuild(animate && previous !== step); renderStep();
}
function goToStep(value) { if (!stepPending) setStep(value); }
for (const [i, lesson] of STEPS.entries()) {
  const button = document.createElement('button'); button.type = 'button'; button.dataset.step = i;
  const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0');
  const name = document.createElement('strong'); name.textContent = lesson.short;
  button.append(number, name); button.setAttribute('aria-label', `${i + 1}단계 ${lesson.short}: ${lesson.title}`);
  button.onclick = () => goToStep(i); $('#step-rail').append(button);
}
$('#next').onclick = () => goToStep((step + 1) % STEPS.length);
$('#previous').onclick = () => goToStep(Math.max(0, step - 1));
document.querySelectorAll('[data-answer]').forEach(button => { button.onclick = () => {
  const lesson = lessonNow(), correct = (button.dataset.answer === 'yes') === lesson.answer;
  $('#quiz-feedback').textContent = `${correct ? '맞아요. ' : '다시 살펴보세요. '}${lesson.feedback}`;
}; });
$('#reset-layout').onclick = () => { positions = {}; sceneAPI?.cancelDrag(); sceneAPI?.updatePositions(); };
$('#mode-mission').onclick = () => changeMode('mission'); $('#mode-flow').onclick = () => changeMode('flow');
$('#close-activity').onclick = () => $('#activity-dialog').close(); $('#close-record').onclick = () => $('#record-dialog').close();
$('#scene-back').onclick = () => missionAction({ kind: 'navigate', index: (mission.history || []).length - 1 });
$('#scene-forward').onclick = () => missionAction({ kind: 'navigate', index: (mission.history || []).length + 1 });
$('#scene-jump').onchange = event => missionAction({ kind: 'navigate', index: Number(event.target.value) });
$('#dialog-back').onclick = () => missionAction({ kind: 'navigate', index: (mission.history || []).length - 1 });
$('#arrange-toggle').onchange = event => { arrange = event.target.checked; sceneAPI?.cancelDrag(); };
renderStep();

async function initScene() {
  const THREE = await import('three');
  const { OrbitControls } = await import('./assets/vendor/three/OrbitControls.js');
  const host = $('#scene'), labelRoot = $('#labels');
  const leaderLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); leaderLayer.classList.add('label-leaders'); leaderLayer.setAttribute('aria-hidden', 'true'); host.append(leaderLayer);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#f0f3eb'); scene.fog = new THREE.Fog('#f0f3eb', 35, 80);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-label', '강조된 동화책나 기록을 조작하는 3D 장면. 이름표 버튼으로도 같은 동작을 할 수 있습니다.');
  host.prepend(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = !reducedMotion.matches; controls.dampingFactor = 0.09;
  controls.enablePan = false; controls.minDistance = 11; controls.maxDistance = 43; controls.minPolarAngle = 0.12; controls.maxPolarAngle = Math.PI / 2.25;
  const hemisphere = new THREE.HemisphereLight('#ffffff', '#889674', 2.5); scene.add(hemisphere);
  const sun = new THREE.DirectionalLight('#fffde9', 3.6); sun.position.set(-6, 16, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 }); sun.shadow.bias = -0.001; sun.shadow.normalBias = 0.025; scene.add(sun);
  const fill = new THREE.DirectionalLight('#b9d6ce', 1.1); fill.position.set(9, 5, -9); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ color: '#e9eee0', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.4; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(60, 60, '#c2ccb5', '#cbd4bf'); grid.position.y = -0.39; grid.material.transparent = true; grid.material.opacity = 0.28; scene.add(grid);
  const sceneGroup = new THREE.Group(); scene.add(sceneGroup);
  const nodeItems = new Map(), labels = [], edges = [], selectable = [];
  let paper = null, prLine = null, packet = null, animation = null, frame = 0, dragging = null, pointerStart = null;
  let actionObject = null, actionLabel = null, dropTarget = null, dropLabel = null, semanticDrag = null, creation = null, trayGrowth = null;
  const intents = [];
  const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(), dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.85);
  const projected = new THREE.Vector3();
  function material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.37, metalness: 0.12, ...extra }); }
  function mesh(geometry, color, parent = sceneGroup) { const item = new THREE.Mesh(geometry, material(color)); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item; }
  function basePosition(key) {
    const [repo, id] = key.split(':'), center = repo === 'local' ? 3.8 : -3.8;
    const x = mode === 'mission' ? { A: -4.5, B: -2.25, C: 0, D: 2.2, M: 4.5, X: .5 } : { A: -4.25, B: -1.5, C: 1.3, M: 4.15 };
    return new THREE.Vector3(x[id], 0.85, center + (['C', 'D'].includes(id) ? 1.1 : -0.7));
  }
  function position(key) { const p = positions[key]; return p ? new THREE.Vector3(p.x, 0.85, p.z) : basePosition(key); }
  function makeLabel(className, point, text) {
    const element = document.createElement('div'); element.className = `scene-label ${className}`;
    if (text) element.textContent = text; labelRoot.append(element);
    const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line'); leaderLayer.append(leader);
    const item = { element, point, leader }; labels.push(item); return item;
  }
  function clearScene() {
    sceneGroup.traverse(object => { object.geometry?.dispose(); if (object.material) { for (const mat of Array.isArray(object.material) ? object.material : [object.material]) mat.dispose(); } });
    sceneGroup.clear(); labelRoot.replaceChildren(); leaderLayer.replaceChildren(); nodeItems.clear(); labels.length = 0; edges.length = 0; selectable.length = 0;
    paper = null; prLine = null; packet = null; animation = null; creation = null; trayGrowth = null; actionObject = null; actionLabel = null; dropTarget = null; dropLabel = null; intents.length = 0;
  }
  function curveBetween(a, b, lift = 0) {
    return new THREE.CubicBezierCurve3(a, new THREE.Vector3(a.x + (b.x - a.x) * .4, a.y + lift, a.z), new THREE.Vector3(b.x - (b.x - a.x) * .4, b.y + lift, b.z), b);
  }
  function updateEdge(edge) {
    const curve = curveBetween(position(edge.from), position(edge.to));
    edge.mesh.geometry.dispose(); edge.mesh.geometry = new THREE.TubeGeometry(curve, 24, .045, 7, false);
  }
  function addEdge(from, to, color) {
    const edge = { from, to, mesh: mesh(new THREE.BufferGeometry(), color) }; edges.push(edge); updateEdge(edge);
  }
  function node(key, repoState, color) {
    const id = key.split(':')[1], point = position(key);
    const group = new THREE.Group(); group.position.copy(point); sceneGroup.add(group);
    const ball = mesh(new THREE.SphereGeometry(.3, 28, 20), color, group); ball.userData.key = key; selectable.push(ball);
    const stand = mesh(new THREE.CylinderGeometry(.06, .075, .6, 10), '#b6c2a5', group); stand.position.y = -.45;
    const base = mesh(new THREE.CylinderGeometry(.43, .43, .06, 32), '#e0e8d4', group); base.position.y = -.65;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.47, .025, 8, 48), new THREE.MeshBasicMaterial({ color: '#9caf36' })); ring.rotation.x = Math.PI / 2; ring.position.y = -.54; group.add(ring);
    const label = makeLabel('node-label', point.clone().add(new THREE.Vector3(0, .42, 0)));
    label.element.dataset.nodeKey = key;
    const tags = document.createElement('div'); tags.className = 'node-tags';
    const addTag = (name, className) => { const tag = document.createElement('span'); tag.className = className; tag.textContent = name; tags.append(tag); };
    if (repoState.main === id) addTag(mode === 'mission' ? '지금 쓰는 기준' : 'main', 'branch-tag');
    if (repoState.branch === id) addTag(mode === 'mission' ? '내 작업' : 'story', 'branch-tag feature');
    if (mode === 'flow' && key.startsWith('local:') && repoState[repoState.head === 'main' ? 'main' : 'branch'] === id) addTag(`HEAD → ${repoState.head}`, 'head-tag');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'commit-select';
    const commit = commitsNow()[id];
    const names = { A: '처음', B: '이전 기록', C: '첫 기록', D: '고친 기록', M: '함께 쓰는 기록', X: '바로 고친 기록' };
    const bold = document.createElement('strong'); bold.textContent = mode === 'mission' ? names[id] : id;
    const hash = document.createElement('span'); hash.className = 'hash'; hash.textContent = mode === 'mission' ? '' : commit.hash.slice(0, 5); button.append(bold, hash);
    button.setAttribute('aria-label', mode === 'mission' ? `${key.startsWith('local:') ? '내' : '팀'} ${names[id]} 내용 보기` : `${key.startsWith('local:') ? '내 컴퓨터' : 'GitHub'} 커밋 ${id}: ${commit.title}`);
    button.onclick = () => selectCommit(key);
    button.setAttribute('aria-description', '클릭하여 내용 확인. 방향키로 구슬 위치 이동.');
    let keyboardBusy = false;
    button.addEventListener('keydown', async event => {
      const offset = { ArrowLeft: [-.35, 0], ArrowRight: [.35, 0], ArrowUp: [0, -.35], ArrowDown: [0, .35] }[event.key];
      if (!offset || !arrange) return; event.preventDefault(); if (keyboardBusy) return; keyboardBusy = true;
      try {
        const p = position(key), local = key.startsWith('local:');
        const moved = { x: THREE.MathUtils.clamp(p.x + offset[0], -5.2, 5.2), z: THREE.MathUtils.clamp(p.z + offset[1], local ? 1.4 : -6.2, local ? 6.2 : -1.4) };
        positions[key] = moved; updatePositions();
      } catch (error) { toast(error.message); }
      finally { keyboardBusy = false; }
    });
    label.element.append(tags, button); nodeItems.set(key, { group, ball, ring, label, button, tags });
  }
  function book(point, color, key, lineCount = commitsNow()[key.split(':')[1]]?.lines.length || 2) {
    const group = new THREE.Group(); group.position.copy(point); sceneGroup.add(group);
    const cover = mesh(new THREE.BoxGeometry(1.55, .2, 1.85), color, group);
    const pages = mesh(new THREE.BoxGeometry(1.38, .12, 1.7), '#fffdec', group); pages.position.y = .16;
    for (let i = 0; i < Math.min(lineCount, 4); i++) { const line = mesh(new THREE.BoxGeometry(.92, .02, .09), i >= 2 ? '#a3b348' : '#b6bda2', group); line.position.set(0, .235, -.53 + i * .34); }
    cover.userData.key = key; selectable.push(cover); return cover;
  }
  function makeMissionObjects(animate) {
    const state = stateNow(), interaction = missionInteraction(mission), early = ['brief', 'draft', 'saved'].includes(mission.phase);
    const localBook = book(new THREE.Vector3(-4.65, .38, 3.1), mission.experiment?.type === 'direct-main' ? '#c89256' : '#738a75', `local:${state.local.main}`);
    book(new THREE.Vector3(-4.65, .38, -4.5), mission.phase === 'merged' || mission.phase === 'done' ? '#acb860' : '#738a75', `remote:${state.remote.main}`);
    let workBook = null;
    if (mission.phase !== 'brief') {
      const tray = mesh(new THREE.BoxGeometry(3.15, .07, 2.1), '#d3dfaa'); tray.position.set(3.7, .23, 5.4);
      const content = mission.phase === 'saved' ? 'C' : mission.phase === 'revised' ? 'D' : state.local.branch;
      workBook = book(new THREE.Vector3(3.8, .45, 5.5), state.file ? '#c9c768' : '#8d9e57', `local:${state.local.branch}`, commitsNow()[content].lines.length);
      if (animate && mission.lastAction === 'branch' && !reducedMotion.matches) { trayGrowth = { object: tray, start: performance.now(), duration: 650 }; tray.scale.x = .01; }
    }
    if (early) makeLabel('workspace-label', new THREE.Vector3(-4.65, 1.2, -4.5), '팀이 쓰는 이야기');
    if (interaction.experiment) { localBook.material.color.set(mission.experiment.type === 'direct-main' ? '#c89256' : '#738a75'); return; }
    if (interaction.source === 'document') actionObject = mission.phase === 'brief' || mission.phase === 'done' ? localBook : workBook;
    else if (interaction.source === 'reviewer') {
      const body = mesh(new THREE.CylinderGeometry(.28, .45, .7, 20), '#cba76c'); body.position.set(4.7, .65, -3.6);
      const head = mesh(new THREE.SphereGeometry(.33, 24, 16), '#f1d9a0'); head.position.set(4.7, 1.3, -3.6); actionObject = head;
    } else actionObject = nodeItems.get(interaction.source)?.ball;
    if (!actionObject) return;
    actionObject.userData.intent = true; intents.push(actionObject);
    const world = actionObject.getWorldPosition(new THREE.Vector3());
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.85, .04, 10, 64), new THREE.MeshBasicMaterial({ color: '#91a42b' })); halo.rotation.x = -Math.PI / 2; halo.position.set(world.x, .29, world.z); sceneGroup.add(halo);
    actionLabel = makeLabel('intent-label', world.clone().add(new THREE.Vector3(0, 1.1, 0)));
    const control = document.createElement('button'); control.type = 'button'; control.className = 'scene-action-button'; control.dataset.sceneAction = interaction.kind; control.textContent = interaction.label; control.onclick = activateScene; actionLabel.element.append(control);
    nodeItems.get(interaction.source)?.label.element.classList.add('is-action-source');
    if (interaction.drop) {
      dropTarget = mesh(new THREE.CylinderGeometry(.92, .92, .035, 48), '#c6d587'); dropTarget.position.set(interaction.drop[0], .28, interaction.drop[1]); dropTarget.material.transparent = true; dropTarget.material.opacity = .45;
      dropLabel = makeLabel('drop-label', new THREE.Vector3(interaction.drop[0], .6, interaction.drop[1]), mission.phase === 'brief' ? '옆에 내 자리 만들기' : mission.phase === 'approved' ? '팀 기준에 반영' : mission.phase === 'merged' ? '내 공간에도 같은 기록' : '팀에도 같은 기록 만들기');
      dropLabel.element.dataset.dropTarget = interaction.kind;
    }
    updateAction();
  }
  function updateAction() {
    const button = actionLabel?.element.querySelector('button'); if (button) button.disabled = !canInteract() || Boolean(animation || creation || trayGrowth);
    host.dataset.animating = String(Boolean(animation || creation || trayGrowth)); document.body.dataset.sceneBusy = host.dataset.animating;
    requestRender();
  }
  function rebuild(animate = false) {
    cancelSemantic(); cancelDrag(); clearScene(); const state = stateNow(), commits = commitsNow();
    if(mode==='mission'){host.dataset.animating='false';document.body.dataset.sceneBusy='false';return;}
    for (const repo of ['remote', 'local']) {
      const z = repo === 'local' ? 3.8 : -3.8;
      const platform = mesh(new THREE.BoxGeometry(12, .25, 5.5), repo === 'local' ? '#e3eacb' : '#d5e6dc'); platform.position.set(0, 0, z);
      const trim = mesh(new THREE.BoxGeometry(12, .035, .08), repo === 'local' ? '#a4b855' : '#72a293'); trim.position.set(0, .14, z + 2.7);
      const mark = mesh(new THREE.BoxGeometry(.1, .04, 4.5), repo === 'local' ? '#d3dfb7' : '#bdd4c7'); mark.position.set(-5.6, .15, z);
      makeLabel(`repo-label ${repo}`, new THREE.Vector3(3.8, .35, z - 1.85), repo === 'local' ? 'LOCAL / 내 컴퓨터' : 'REMOTE / GitHub');
      if (!state[repo].commits.length) makeLabel('empty-label', new THREE.Vector3(0, .3, z), 'Clone으로 가져올 공간');
      const visible = mode === 'mission' ? state[repo].commits.filter(id => id !== 'A' && (!['brief', 'draft', 'saved'].includes(mission.phase) || mission.experiment?.type === 'direct-main')) : state[repo].commits;
      for (const id of visible) {
        const color = id === 'C' ? '#a6ba37' : id === 'D' ? '#d7a85d' : id === 'M' ? '#9aab55' : repo === 'local' ? '#5c7352' : '#4d9385';
        node(`${repo}:${id}`, state[repo], color);
        for (const parent of commits[id].parents) if (visible.includes(parent)) addEdge(`${repo}:${parent}`, `${repo}:${id}`, ['C', 'D'].includes(id) || (id === 'M' && ['C', 'D'].includes(parent)) ? '#a3b548' : repo === 'local' ? '#748867' : '#75a697');
      }
    }
    if (mode === 'mission') makeMissionObjects(animate);
    if (state.file && mode === 'flow') {
      paper = new THREE.Group(); paper.position.set(1.3, .5, 4.9); sceneGroup.add(paper);
      for (let i = 0; i < 3; i++) { const sheet = mesh(new THREE.BoxGeometry(1.1, .045, 1.4), i === 2 ? '#ffffed' : '#d6ddbe', paper); sheet.position.set(i * .035, i * .08, 0); }
      for (let i = 0; i < 3; i++) { const line = mesh(new THREE.BoxGeometry(.74, .015, .06), i === 2 ? '#9caf35' : '#bbc5a4', paper); line.position.set(.05, .19, -.35 + i * .3); }
      makeLabel('paper-label', new THREE.Vector3(1.3, 1.35, 4.9), state.file === 'staged' ? 'Staging · snow-white.md' : '작업 폴더 · snow-white.md');
    }
    if (state.pr === 'open') {
      const geometry = new THREE.BufferGeometry().setFromPoints(curveBetween(position(`remote:${state.remote.branch}`), position('remote:B'), 2).getPoints(48));
      prLine = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: '#7d8ab8', dashSize: .17, gapSize: .12 })); prLine.computeLineDistances(); sceneGroup.add(prLine);
      makeLabel('pr-label', new THREE.Vector3(3.4, 3.3, -2.4), 'PR #12 · story → main · 검토 중');
    }
    const motionStep = mode === 'flow' ? step : ({ commit: 5, push: 6, 'commit-revision': 5, 'push-revision': 6, merge: 8, pull: 9 })[mission.lastAction];
    if (animate && !reducedMotion.matches && [1, 5, 6, 8, 9].includes(motionStep)) {
      let from, to;
      const branch = state.local.branch;
      if (motionStep === 1) { from = position('remote:B'); to = position('local:B'); }
      if (motionStep === 5) { from = new THREE.Vector3(3.8, .6, 5.5); to = position(`local:${branch}`); }
      if (motionStep === 6) { from = position(`local:${branch}`); to = position(`remote:${branch}`); }
      if (motionStep === 8) { from = position(`remote:${state.remote.branch}`); to = position('remote:M'); }
      if (motionStep === 9) { from = position('remote:M'); to = position('local:M'); }
      packet = mesh(new THREE.SphereGeometry(.2, 20, 14), '#e0ef74');
      animation = { curve: curveBetween(from, to, 3), start: performance.now(), duration: 1400 };
      if (mode === 'mission') {
        const key = motionStep === 5 ? `local:${branch}` : motionStep === 6 ? `remote:${branch}` : motionStep === 8 ? 'remote:M' : 'local:M';
        const target = nodeItems.get(key);
        if (target) {
          creation = { target, edges: edges.filter(edge => edge.to === key), start: animation.start + 850, duration: 550 };
          target.group.scale.setScalar(.001); target.label.element.style.opacity = '0'; creation.edges.forEach(edge => edge.mesh.geometry.setDrawRange(0, 0));
        }
      }
    }
    updateLocks(); updateAction(); select(selected); requestRender();
  }
  function select(key) {
    for (const [id, item] of nodeItems) { item.ring.visible = id === key; item.button.setAttribute('aria-pressed', String(id === key)); }
    requestRender();
  }
  function updatePositions() {
    for (const [key, item] of nodeItems) { const point = position(key); item.group.position.copy(point); item.label.point.copy(point).y += .42; }
    for (const edge of edges) updateEdge(edge);
    if (prLine) { prLine.geometry.dispose(); prLine.geometry = new THREE.BufferGeometry().setFromPoints(curveBetween(position(`remote:${stateNow().remote.branch}`), position('remote:B'), 2).getPoints(48)); prLine.computeLineDistances(); }
    requestRender();
  }
  function updateLocks() { requestRender(); }
  function pointOnPlane(event) {
    const rect = renderer.domElement.getBoundingClientRect(); mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(mouse, camera); const point = new THREE.Vector3(); return raycaster.ray.intersectPlane(dragPlane, point) ? point : null;
  }
  function updateLabels() {
    const width = host.clientWidth, height = host.clientHeight;
    leaderLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    function screen(point) { projected.copy(point).project(camera); return { x: (projected.x + 1) / 2 * width, y: (1 - projected.y) / 2 * height, z: projected.z }; }
    if (actionObject && actionLabel) {
      const p = screen(actionObject.getWorldPosition(new THREE.Vector3())); actionLabel.element.dataset.semanticSource = missionInteraction(mission).kind;
      actionLabel.element.dataset.sourceX = p.x.toFixed(2); actionLabel.element.dataset.sourceY = p.y.toFixed(2);
    }
    if (dropTarget && dropLabel) { const p = screen(new THREE.Vector3(dropTarget.position.x, .85, dropTarget.position.z)); dropLabel.element.dataset.dropX = p.x.toFixed(2); dropLabel.element.dataset.dropY = p.y.toFixed(2); }
    const occupied = [], spheres = [];
    for (const item of nodeItems.values()) {
      const p = screen(item.group.position); spheres.push({ left: p.x - 9, right: p.x + 9, top: p.y - 8, bottom: p.y + 8 });
      item.label.element.dataset.screenX = p.x.toFixed(2); item.label.element.dataset.screenY = p.y.toFixed(2);
      item.label.element.dataset.worldX = item.group.position.x.toFixed(3); item.label.element.dataset.worldZ = item.group.position.z.toFixed(3);
      item.label.element.dataset.renderScale = item.group.scale.x.toFixed(3);
    }
    const intersects = (a, b) => a.left < b.right + 4 && a.right + 4 > b.left && a.top < b.bottom + 3 && a.bottom + 3 > b.top;
    const projectedLabels = labels.map(label => ({ ...label, anchor: screen(label.point) })).sort((a, b) => Number(b.element.classList.contains('node-label')) - Number(a.element.classList.contains('node-label')) || a.anchor.y - b.anchor.y);
    for (const label of projectedLabels) {
      const { element, anchor, leader } = label, node = element.classList.contains('node-label');
      if (element.classList.contains('repo-label')) {
        const local = element.classList.contains('local');
        const text = mode === 'mission' ? local ? '내 컴퓨터' : '함께 보는 공간' : width < 520 ? local ? '내 컴퓨터' : 'GitHub' : local ? 'LOCAL / 내 컴퓨터' : 'REMOTE / GitHub';
        if (element.textContent !== text) element.textContent = text;
      }
      if (element.classList.contains('pr-label')) {
        const status = mode === 'mission' ? ({ review: '답변 기다리는 중', changes: '수정 의견 도착', revised: '고치는 중', recommitted: '아직 공유 전', reposted: '다시 확인 중', approved: '동료 확인 완료' })[mission.phase] || '확인 중' : '검토 중';
        element.textContent = mode === 'mission' ? status : width < 520 ? `PR · ${status}` : `PR #12 · story → main · ${status}`;
      }
      const visible = anchor.z >= -1 && anchor.z <= 1 && anchor.x > 0 && anchor.x < width && anchor.y > 0 && anchor.y < height;
      element.style.visibility = visible ? 'visible' : 'hidden'; leader.style.display = 'none'; if (!visible) continue;
      const w = element.offsetWidth, h = element.offsetHeight, factor = node ? 1 : .5;
      let best = null;
      for (const dx of [0, -36, 36, -72, 72, -108, 108, -144, 144]) for (const dy of [0, -24, 24, -48, 48, -72, 72, -96, 96, -120, 120]) {
        const x = THREE.MathUtils.clamp(anchor.x + dx, w / 2 + 8, width - w / 2 - 8);
        const y = THREE.MathUtils.clamp(anchor.y + dy, 50 + h * factor, height - h * (1 - factor) - 8);
        const box = { left: x - w / 2, right: x + w / 2, top: y - h * factor, bottom: y + h * (1 - factor) };
        const score = (x - anchor.x) ** 2 + (y - anchor.y) ** 2 * 1.2;
        if ((!best || score < best.score) && !occupied.some(other => intersects(box, other)) && !spheres.some(other => intersects(box, other))) best = { x, y, box, score };
      }
      if (!best) { const x = THREE.MathUtils.clamp(anchor.x, w / 2 + 8, width - w / 2 - 8), y = Math.max(50 + h * factor, anchor.y); best = { x, y, box: { left: x - w / 2, right: x + w / 2, top: y - h * factor, bottom: y + h * (1 - factor) }, score: 0 }; }
      element.style.left = `${best.x}px`; element.style.top = `${best.y}px`; occupied.push(best.box);
      if (best.score > 100) {
        leader.style.display = ''; leader.setAttribute('x1', anchor.x); leader.setAttribute('y1', anchor.y);
        leader.setAttribute('x2', best.x); leader.setAttribute('y2', best.box.bottom);
      }
    }
  }
  function tick(time) {
    frame = 0; if (document.hidden) return;
    const moving = controls.update();
    if (animation && packet) {
      const progress = Math.min(1, (time - animation.start) / animation.duration), eased = progress * progress * (3 - 2 * progress);
      packet.position.copy(animation.curve.getPoint(eased));
      if (progress >= 1) { packet.visible = false; animation = null; }
    }
    if (creation) {
      const progress = THREE.MathUtils.clamp((time - creation.start) / creation.duration, 0, 1), eased = progress * progress * (3 - 2 * progress);
      creation.target.group.scale.setScalar(Math.max(.001, eased)); creation.target.label.element.style.opacity = String(eased);
      creation.edges.forEach(edge => edge.mesh.geometry.setDrawRange(0, Math.floor(edge.mesh.geometry.index.count * eased / 3) * 3));
      if (progress >= 1) { creation.target.group.scale.setScalar(1); creation.target.label.element.style.opacity = ''; creation.edges.forEach(edge => edge.mesh.geometry.setDrawRange(0, Infinity)); creation = null; }
    }
    if (trayGrowth) { const progress = Math.min(1, (time - trayGrowth.start) / trayGrowth.duration); trayGrowth.object.scale.x = Math.max(.01, progress); if (progress >= 1) trayGrowth = null; }
    const busy = Boolean(animation || creation || trayGrowth); host.dataset.animating = String(busy); document.body.dataset.sceneBusy = String(busy);
    const actionButton = actionLabel?.element.querySelector('button'); if (actionButton) actionButton.disabled = !canInteract() || busy;
    updateLabels(); renderer.render(scene, camera);
    if (moving || busy) requestRender();
  }
  function requestRender() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  controls.addEventListener('change', requestRender);
  function resetView() { controls.target.set(0, .5, 0); const scale = host.clientWidth < 500 ? 1.38 : 1; camera.position.set(6.5, 14, 17).multiplyScalar(scale); controls.update(); requestRender(); }
  function resize() { const width = host.clientWidth, height = host.clientHeight; if(!width||!height)return; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); requestRender(); }
  new ResizeObserver(resize).observe(host); resize(); resetView();
  $('#reset-view').onclick = resetView;
  function rotate(angle) { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle); camera.position.copy(controls.target).add(offset); controls.update(); requestRender(); }
  $('#rotate-left').onclick = () => rotate(-Math.PI / 8); $('#rotate-right').onclick = () => rotate(Math.PI / 8);
  function zoom(factor) { const offset = camera.position.clone().sub(controls.target); const distance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance); offset.setLength(distance); camera.position.copy(controls.target).add(offset); controls.update(); requestRender(); }
  $('#zoom-in').onclick = () => zoom(.85); $('#zoom-out').onclick = () => zoom(1.18);
  function cancelDrag() {
    cancelSemantic();
    if (dragging || pointerStart) { controls.enabled = true; try { renderer.domElement.releasePointerCapture(pointerStart?.id); } catch {} }
    dragging = null; pointerStart = null;
  }
  function cancelSemantic() {
    if (!semanticDrag) return;
    if (semanticDrag.ghost) { sceneGroup.remove(semanticDrag.ghost); semanticDrag.ghost.geometry.dispose(); semanticDrag.ghost.material.dispose(); }
    try { renderer.domElement.releasePointerCapture(semanticDrag.id); } catch {}
    semanticDrag = null; controls.enabled = true;
    if (dropTarget) dropTarget.material.color.set('#c6d587'); requestRender();
  }
  function beginSemantic(event) {
    if (!canInteract() || animation || creation || trayGrowth) return;
    event.stopImmediatePropagation(); controls.enabled = false;
    const interaction = missionInteraction(mission);
    semanticDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, drop: interaction.drop, ghost: null };
    renderer.domElement.setPointerCapture(event.pointerId);
    if (interaction.drop) {
      const ghost = new THREE.Mesh(actionObject.geometry.clone(), actionObject.material.clone()); ghost.material.transparent = true; ghost.material.opacity = .6;
      ghost.position.copy(actionObject.getWorldPosition(new THREE.Vector3())); ghost.quaternion.copy(actionObject.getWorldQuaternion(new THREE.Quaternion())); ghost.visible = false;
      sceneGroup.add(ghost); semanticDrag.ghost = ghost;
    }
  }
  renderer.domElement.addEventListener('pointerdown', async event => {
    if (event.button !== 0 || dragging) return;
    pointOnPlane(event);
    const hit = raycaster.intersectObjects([...new Set([...intents, ...selectable])])[0]; if (!hit) return;
    if (mode === 'mission' && hit.object.userData.intent) { beginSemantic(event); return; }
    const key = hit.object.userData.key; selectCommit(key);
    if (!arrange) return;
    event.stopImmediatePropagation(); controls.enabled = false;
    const start = { id: event.pointerId, key }; pointerStart = start;
    renderer.domElement.setPointerCapture(event.pointerId);
    try {
      if (pointerStart !== start) return;
      const point = pointOnPlane(event); dragging = { key, offset: point ? position(key).sub(point) : new THREE.Vector3() };
    } catch (error) { cancelDrag(); toast(error.message); }
  }, { capture: true });
  renderer.domElement.addEventListener('pointermove', event => {
    const point = pointOnPlane(event); if (!point) return;
      if (semanticDrag) {
      semanticDrag.moved ||= Math.hypot(event.clientX - semanticDrag.x, event.clientY - semanticDrag.y) > 6;
      if (semanticDrag.ghost) {
        semanticDrag.ghost.visible = semanticDrag.moved; semanticDrag.ghost.position.copy(point);
        if (dropTarget) dropTarget.material.color.set(Math.hypot(point.x - semanticDrag.drop[0], point.z - semanticDrag.drop[1]) < 1.25 ? '#8daa3a' : '#c6d587');
      }
      requestRender(); return;
    }
    if (dragging) {
      point.add(dragging.offset); const local = dragging.key.startsWith('local:');
      const p = { x: THREE.MathUtils.clamp(point.x, -5.2, 5.2), z: THREE.MathUtils.clamp(point.z, local ? 1.4 : -6.2, local ? 6.2 : -1.4) };
      positions[dragging.key] = p; updatePositions();

    }
  });
  async function finishDrag(event) {
    if (semanticDrag?.id === event.pointerId) {
      const point = pointOnPlane(event), drag = semanticDrag;
      const accepted = !drag.moved || (drag.drop && point && Math.hypot(point.x - drag.drop[0], point.z - drag.drop[1]) < 1.25);
      cancelSemantic();
      if (event.type !== 'pointercancel') { if (accepted) await activateScene(); else toast('표시된 자리에 놓아보세요. 아직 내용은 바뀌지 않았어요.'); }
      return;
    }
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    cancelDrag();
  }
  renderer.domElement.addEventListener('pointerup', finishDrag);
  renderer.domElement.addEventListener('pointercancel', finishDrag);
  addEventListener('blur', () => { cancelDrag(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestRender(); else { cancelDrag(); } });
  reducedMotion.addEventListener('change', () => { controls.enableDamping = !reducedMotion.matches; if (reducedMotion.matches) rebuild(false); requestRender(); });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); $('#loading').hidden = false; $('#loading').className = 'error'; $('#loading').textContent = '3D 그래픽 연결이 끊겼습니다. 페이지를 새로고침해 주세요. 단계 설명과 커밋 내용은 계속 볼 수 있습니다.'; });
  sceneAPI = { rebuild, select, updatePositions, updateLocks, updateAction, cancelDrag, requestRender };
  rebuild(); $('#loading').hidden = true; host.dataset.ready = 'true';
}
let sceneInitialization;
function ensureScene(){if(!sceneInitialization)sceneInitialization=initScene().catch(error => {
  console.error('3D initialization failed:', error);
  $('#loading').className = 'error'; $('#loading').textContent = '3D 화면을 시작하지 못했습니다. WebGL을 지원하는 브라우저에서 하드웨어 가속을 켜고 다시 열어주세요. 단계별 설명은 오른쪽에서 계속 탐색할 수 있습니다.';
});return sceneInitialization;}
if(mode==='flow')ensureScene();
