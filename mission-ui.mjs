import { DRAFTS, REVISIONS, MILESTONES, missionGroup, missionCommits, phaseIndex, missionInteraction, missionObservation } from './mission-model.mjs';
const $ = selector => document.querySelector(selector);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };

export function createMissionUI({ dispatch, getContext, selectCommit }) {
  function button(text, action, className = 'mission-primary') {
    const node = el('button', className, text); node.type = 'button';
    node.onclick = async () => { node.disabled = true; try { await action(); } finally { if (node.isConnected) node.disabled = false; } }; return node;
  }
  function renderRoles() { $('#mission-roles').hidden = true; }
  function render() {
    const { mission: m } = getContext(), root = $('#mission-actions'), commits = missionCommits(m), index = phaseIndex(m), interaction = missionInteraction(m);
    const canAuthor = true, canReview = true;
    root.replaceChildren(); renderRoles();
    $('#action-instruction').textContent = interaction.instruction;
    $('#action-hint').textContent = interaction.role === 'reviewer' ? '가상 동료 지수의 작업을 한 단계씩 살펴보세요.' : '강조된 저장소에서 다음 동작을 해보세요. 각 로컬은 자동으로 동기화되지 않습니다.';
    $('#mission-progress').replaceChildren(...MILESTONES.map((name, i) => { const item = el('li', i === missionGroup(m) ? 'current' : i < missionGroup(m) ? 'complete' : '', name); return item; }));
    const observation = missionObservation(m);
    $('#mission-observation').hidden = !observation;
    $('#observed-change').textContent = observation?.[0] || '';
    $('#concept-name').textContent = observation ? `이 동작의 이름 · ${observation[1]}` : '';
    const experiments = $('#experiments-options'); experiments.replaceChildren();
    if (canAuthor && !m.experiment) {
      if (m.phase === 'brief') experiments.append(button('원본에서 바로 고쳐 기록해보기', () => dispatch({ kind: 'try-main' }), 'experiment-button'));
      if ([3, 4, 8, 9].includes(index)) experiments.append(button('지금 동료에게 보이는 내용 확인하기', () => dispatch({ kind: 'inspect-peer' }), 'experiment-button'));
      if (m.phase === 'done') experiments.append(button('처음부터 다시 해보기', () => dispatch({ kind: 'restart' }), 'experiment-button'));
    }
    $('#experiments-details').hidden = !experiments.children.length;
    const result = $('#experiment-result'); result.replaceChildren(); result.hidden = !m.experiment;
    if (m.experiment) {
      const direct = m.experiment.type === 'direct-main', keys = direct ? ['X', 'B'] : [m.experiment.mine, m.experiment.theirs];
      const comparison = el('div', 'experiment-comparison');
      keys.forEach((key, i) => { const card = el('section', 'experiment-file'); card.append(el('h3', '', i === 0 ? direct ? '내 컴퓨터의 기준' : '내가 만든 기록' : '동료에게 보이는 이야기')); for (const line of commits[key].lines) card.append(el('p', '', line)); comparison.append(card); });
      result.append(comparison);
      if (canAuthor) result.append(button('실험 되돌리기', () => dispatch({ kind: 'undo-experiment' }), 'experiment-button'));
    }
    const names = { draft: '아는 장면을 한 문장 보태보세요', changes: '동료와 다음 장면을 이어보세요', review: '동료가 보탠 장면을 읽어보세요', reposted: '고친 장면을 함께 확인하세요' };
    $('#activity-title').textContent = names[m.phase] || '지금 동화책 살펴보기';
    function diff(id) {
      const box = el('section', 'mission-diff'); box.setAttribute('aria-label', '동화책 내용'); box.append(el('h3', '', id === 'D' ? '고친 이야기' : '처음 쓴 이야기'));
      commits[id].lines.forEach((line, i) => box.append(el('p', i >= 2 ? 'diff-added' : 'diff-context', `${i >= 2 ? '+ ' : ''}${line}`))); root.append(box);
    }
    if (['review', 'changes'].includes(m.phase)) diff('C');
    if (m.phase === 'reposted') diff('D');
    if (m.conversation.length) {
      const last = m.conversation.at(-1), comment = el('div', `review-comment ${last.who}`);
      comment.append(el('span', 'comment-who', `${last.name} · ${last.who === 'reviewer' ? '확인하는 동료' : '고치는 사람'}`), el('p', '', last.text)); root.append(comment);
      if (m.conversation.length > 1) {
        const history = el('details', 'review-history'); history.append(el('summary', '', '앞선 대화 보기'));
        m.conversation.slice(0, -1).forEach(entry => history.append(el('p', '', `${entry.name}: ${entry.text}`))); root.append(history);
      }
    }
    function choices(legend, options, submit, kind, reviewer = false) {
      if (reviewer ? !canReview : !canAuthor) { root.append(el('p', 'mission-wait', '동료의 응답을 기다리고 있어요.')); return; }
      if ((m.future || []).length) root.append(el('p', 'path-change-note', '이 선택을 적용하면 뒤의 기록·리뷰·승인은 다시 진행합니다. 보기만 하려면 창을 닫고 ‘다시 앞으로’를 누르세요.'));
      const nextPhase = kind === 'save' ? 'saved' : kind === 'revise' ? 'revised' : null;
      const stored = (m.future || []).find(item => item.phase === nextPhase);
      let selected = kind === 'save' ? stored?.draft || null : kind === 'revise' ? stored?.revision || null : null;
      const fieldset = el('fieldset', 'mission-choices'); fieldset.append(el('legend', '', legend));
      const apply = button(submit, () => dispatch({ kind, ...(reviewer ? { issue: selected } : { choice: selected }) })); apply.disabled = !selected;
      for (const [id, title, text] of options) {
        const label = el('label', 'mission-choice'), radio = el('input'); radio.type = 'radio'; radio.name = `choice-${m.phase}`; radio.value = id;
        radio.checked = id === selected;
        radio.onchange = () => { selected = id; apply.disabled = false; };
        const copy = el('span'); copy.append(el('strong', '', title), el('span', '', text)); label.append(radio, copy); fieldset.append(label);
      }
      root.append(fieldset, apply);
    }
    if (m.phase === 'draft') choices('어느 장면부터 보탤까요? 둘 다 이야기에 들어갈 내용이에요.', Object.entries(DRAFTS).map(([id, data]) => [id, data.label, data.line]), '이 내용으로 고치기', 'save');
    if (m.phase === 'changes') choices('고칠 내용', Object.entries(REVISIONS).map(([id, data]) => [id, data.label, data.lines.join(' ')]), '이 내용으로 다시 고치기', 'revise');
    if (m.phase === 'reposted' && canReview) {
      const checked = new Set(), fieldset = el('fieldset', 'review-checks'); fieldset.append(el('legend', '', '함께 읽고 확인해 보세요'));
      const approve = button('가상 동료의 확인 받기', () => dispatch({ kind: 'approve', commit: 'D', checks: [...checked] })); approve.disabled = true;
      for (const [id, text] of [['seven', '일곱 난쟁이가 등장해요'], ['together', '함께 살게 되는 장면으로 이어져요']]) {
        const label = el('label'), input = el('input'); input.type = 'checkbox'; input.value = id; input.onchange = () => { input.checked ? checked.add(id) : checked.delete(id); approve.disabled = checked.size !== 2; }; label.append(input, el('span', '', text)); fieldset.append(label);
      }
      root.append(fieldset, approve);
    }
    const compare = $('#compare-actions'); compare.replaceChildren();
    compare.append(button('팀에서 쓰는 이야기 보기', () => selectCommit(index >= 11 ? 'remote:M' : m.peerStage >= 4 ? 'remote:P' : 'remote:B'), 'compare-button'));
    if (m.peerStage >= 2) compare.append(button('동료의 제목 기록 보기', () => selectCommit('peer:T'), 'compare-button'));
    if (index >= 3) compare.append(button('처음 기록 보기', () => selectCommit('local:C'), 'compare-button'));
    if (index >= 8) compare.append(button('고친 기록 보기', () => selectCommit('local:D'), 'compare-button'));
    $('#mission-scene-task').textContent = '필요한 내용만 펼쳐보세요.';
    $('#mission-message').textContent = '';
  }
  return { render, renderRoles };
}
