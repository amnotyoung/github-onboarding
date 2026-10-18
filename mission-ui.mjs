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
    root.replaceChildren(); renderRoles();
    $('#action-instruction').textContent = interaction.instruction;
    $('#action-hint').textContent = interaction.context;
    $('#mission-progress').replaceChildren(...MILESTONES.map((name, i) => { const item = el('li', i === missionGroup(m) ? 'current' : i < missionGroup(m) ? 'complete' : '', name); return item; }));
    const observation = missionObservation(m);
    $('#mission-observation').hidden = !observation;
    $('#observed-change').textContent = observation?.[0] || '';
    $('#concept-name').textContent = observation ? `개념 이름 · ${observation[1]}` : '';
    const experiments = $('#experiments-options'); experiments.replaceChildren();
    if (!m.experiment) {
      if (m.phase === 'brief') experiments.append(button('기준본 직접 수정 실험', () => dispatch({ kind: 'try-main' }), 'experiment-button'));
      if ([3, 4, 8, 9].includes(index)) experiments.append(button('지수가 GitHub에서 볼 수 있는 기록 비교', () => dispatch({ kind: 'inspect-peer' }), 'experiment-button'));
      if (m.phase === 'done') experiments.append(button('처음부터 다시 시작하기', () => dispatch({ kind: 'restart' }), 'experiment-button'));
    }
    $('#experiments-details').hidden = !experiments.children.length;
    const result = $('#experiment-result'); result.replaceChildren(); result.hidden = !m.experiment;
    if (m.experiment) {
      const direct = m.experiment.type === 'direct-main', keys = direct ? ['X', 'B'] : [m.experiment.mine, m.experiment.theirs];
      const comparison = el('div', 'experiment-comparison');
      keys.forEach((key, i) => {
        const card = el('section', 'experiment-file');
        card.append(el('h3', '', i === 0 ? direct ? '내 기준본' : '내 작업 기록' : direct ? 'GitHub 기준본' : '지수가 GitHub에서 볼 수 있는 기록'));
        for (const line of commits[key].lines) card.append(el('p', '', line));
        comparison.append(card);
      });
      result.append(comparison, button('실험 되돌리기', () => dispatch({ kind: 'undo-experiment' }), 'experiment-button'));
    }
    const names = { draft: '본문에 추가할 문장', changes: '지수의 의견과 수정 문장', review: '지수의 의견', reposted: '지수의 검토' };
    $('#activity-title').textContent = names[m.phase] || '본문 내용';
    function diff(id) {
      const box = el('section', 'mission-diff'); box.setAttribute('aria-label', '기록한 본문'); box.append(el('h3', '', id === 'D' ? '수정 기록 D' : '초안 기록 C'));
      commits[id].lines.forEach((line, i) => box.append(el('p', i >= 2 ? 'diff-added' : 'diff-context', `${i >= 2 ? '+ ' : ''}${line}`))); root.append(box);
    }
    if (['review', 'changes'].includes(m.phase)) diff('C');
    if (m.phase === 'reposted') diff('D');
    if (m.conversation.length) {
      const last = m.conversation.at(-1), comment = el('div', `review-comment ${last.who}`);
      comment.append(el('span', 'comment-who', last.name), el('p', '', last.text)); root.append(comment);
      if (m.conversation.length > 1) {
        const history = el('details', 'review-history'); history.append(el('summary', '', '이전 대화 보기'));
        m.conversation.slice(0, -1).forEach(entry => history.append(el('p', '', `${entry.name}: ${entry.text}`))); root.append(history);
      }
    }
    function instruction(text) {
      const node = el('p', 'activity-instruction', text); node.id = 'activity-instruction'; node.setAttribute('aria-live', 'polite'); return node;
    }
    function choices(options, submit, kind) {
      if ((m.future || []).length) root.append(el('p', 'path-change-note', '다른 문장을 저장하면 이후 진행 결과는 사라집니다. 저장하지 않으면 기존 결과는 그대로입니다.'));
      const nextPhase = kind === 'save' ? 'saved' : 'revised';
      const stored = (m.future || []).find(item => item.phase === nextPhase);
      let selected = kind === 'save' ? stored?.draft || null : stored?.revision || null;
      const hint = instruction('저장할 문장을 선택하세요.');
      const fieldset = el('fieldset', 'mission-choices'); fieldset.append(el('legend', '', '두 선택 모두 사용할 수 있습니다.'));
      const apply = button(submit, () => dispatch({ kind, choice: selected })); apply.disabled = !selected;
      const update = () => { hint.textContent = selected ? `“${submit}” 버튼을 누르세요.` : '저장할 문장을 선택하세요.'; apply.disabled = !selected; };
      for (const [id, title, text] of options) {
        const label = el('label', 'mission-choice'), radio = el('input'); radio.type = 'radio'; radio.name = `choice-${m.phase}`; radio.value = id;
        radio.checked = id === selected;
        radio.onchange = () => { selected = id; update(); };
        const copy = el('span'); copy.append(el('strong', '', title), el('span', '', text)); label.append(radio, copy); fieldset.append(label);
      }
      update(); root.append(hint, fieldset, apply);
    }
    if (m.phase === 'draft') choices(Object.entries(DRAFTS).map(([id, data]) => [id, data.label, data.line]), '선택한 문장 저장하기', 'save');
    if (m.phase === 'changes') choices(Object.entries(REVISIONS).map(([id, data]) => [id, data.label, data.lines.join(' ')]), '선택한 수정 문장 저장하기', 'revise');
    if (m.phase === 'reposted') {
      const checks = [['seven', '일곱 난쟁이가 나옵니다.'], ['together', '함께 사는 장면이 있습니다.']];
      const checked = new Set(), fieldset = el('fieldset', 'review-checks'); fieldset.append(el('legend', '', '지수가 확인할 내용'));
      const hint = instruction('');
      const approve = button('지수의 승인 받기', () => dispatch({ kind: 'approve', commit: 'D', checks: [...checked] }));
      const update = () => {
        const next = checks.find(([id]) => !checked.has(id));
        hint.textContent = next ? `수정 기록 D에서 “${next[1]}” 항목을 확인하세요.` : '“지수의 승인 받기” 버튼을 누르세요.';
        approve.disabled = Boolean(next);
      };
      for (const [id, text] of checks) {
        const label = el('label'), input = el('input'); input.type = 'checkbox'; input.value = id;
        input.onchange = () => { input.checked ? checked.add(id) : checked.delete(id); update(); };
        label.append(input, el('span', '', text)); fieldset.append(label);
      }
      update(); root.append(hint, fieldset, approve);
    }
    const compare = $('#compare-actions'); compare.replaceChildren();
    compare.append(button('GitHub 기준본 보기', () => selectCommit(index >= 11 ? 'remote:M' : m.peerStage >= 4 ? 'remote:P' : 'remote:B'), 'compare-button'));
    if (m.peerStage >= 2) compare.append(button('지수의 제목 기록 T 보기', () => selectCommit('peer:T'), 'compare-button'));
    if (index >= 3) compare.append(button('내 초안 기록 C 보기', () => selectCommit('local:C'), 'compare-button'));
    if (index >= 8) compare.append(button('내 수정 기록 D 보기', () => selectCommit('local:D'), 'compare-button'));
    $('#mission-scene-task').textContent = '볼 기록을 선택하세요.';
    $('#mission-message').textContent = '';
  }
  return { render, renderRoles };
}
