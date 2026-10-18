// One repository and one named reviewer are used across all three lesson modes.
export const MODES = {
  mission: { label: '2D 협업지도', title: '내 변경을 지수가 검토하고 합칩니다', issues: false, feedback: true, expanded:false },
  coordination: { label: '이슈/충돌 실습', title: '두 PR의 변경이 같은 줄에서 만납니다', issues: true, feedback: false, expanded:false },
  combined: { label: '협업+이슈/충돌 실습', title: '할 일부터 검토와 충돌 해결까지 이어갑니다', issues: true, feedback: true, expanded:true },
};
export const TEXT = {
  base: '백설공주는 그 집에서 지냈습니다.',
  draft: '백설공주는 난쟁이들과 그 집에서 살았습니다.',
  revised: '백설공주는 일곱 난쟁이와 그 집에서 살았습니다.',
  happy: '백설공주는 그 집에서 행복하게 살았습니다.',
  resolved: '백설공주는 일곱 난쟁이와 그 집에서 행복하게 살았습니다.',
  proposal: '신데렐라는 왕자와 무도회에 갔습니다.',
};
export const ROLE_NOTE = '나는 파일을 수정해 PR을 만듭니다. 지수는 검토·병합을 맡고, 충돌이 생기면 자기 컴퓨터에서 해결해 공유합니다. 통합 실습에서는 민수의 제안을 병합 없이 닫는 경우도 봅니다.';
const spec = (id,label,title,zone,concept) => ({id,label,title,zone,concept});
const STEPS = {
  'assign-story': spec('assign-story','지수가 이야기 이슈를 내게 할당하기','이야기 이슈 할당','issues','이슈 할당 · assignee'),
  'assign-happy': spec('assign-happy','지수가 결말 이슈를 내게 할당하기','결말 이슈 할당','issues','이슈 할당 · assignee'),
  'clone-mine': spec('clone-mine','내 컴퓨터에 저장소 복제하기','내 저장소 복제','mine','복제 · clone'),
  'clone-jisu': spec('clone-jisu','지수가 충돌 해결용 저장소 복제하기','지수의 로컬 준비','jisu','복제 · clone'),
  'checkout-jisu': spec('checkout-jisu','지수가 PR 작업 공간 열기','지수의 happy 브랜치','jisu','PR 브랜치 전환'),
  'branch-story': spec('branch-story','이야기 작업 공간 만들기','이야기 브랜치','mine','브랜치 · branch'),
  'edit-story': spec('edit-story','수정할 본문 보기','본문 수정','mine','파일 저장'),
  'commit-story': spec('commit-story','내 변경 기록하기','초안 기록','mine','기록 · commit'),
  'push-story': spec('push-story','내 기록 공유하기','초안 공유','mine','공유 · push'),
  'pr-story': spec('pr-story','이야기 PR 만들기','이야기 PR','remote','검토 요청 · pull request'),
  'review-story': spec('review-story','지수의 검토 의견 보기','지수의 수정 의견','pr-story','검토 · review'),
  'revise-story': spec('revise-story','의견을 반영한 본문 보기','본문 재수정','mine','파일 저장'),
  'commit-revision': spec('commit-revision','수정한 본문 기록하기','수정 기록','mine','기록 · commit'),
  'push-revision': spec('push-revision','수정 기록 공유하기','수정 기록 공유','mine','공유 · push'),
  'approve-story': spec('approve-story','지수가 이야기 PR 승인하기','이야기 PR 승인','pr-story','승인 · approval'),
  'branch-happy': spec('branch-happy','기준본에서 결말 작업 공간 만들기','두 번째 브랜치','mine','브랜치 · branch'),
  'edit-happy': spec('edit-happy','수정할 결말 보기','결말 수정','mine','파일 저장'),
  'commit-happy': spec('commit-happy','결말 변경 기록하기','결말 기록','mine','기록 · commit'),
  'push-happy': spec('push-happy','결말 기록 공유하기','결말 공유','mine','공유 · push'),
  'pr-happy': spec('pr-happy','결말 PR 만들기','결말 PR','remote','검토 요청 · pull request'),
  'approve-happy': spec('approve-happy','지수가 결말 PR 승인하기','결말 PR 승인','pr-happy','승인 · approval'),
  'merge-story': spec('merge-story','지수가 이야기 PR 합치기','첫 번째 병합','pr-story','합치기 · merge'),
  'inspect-conflict': spec('inspect-conflict','지수가 main을 happy에 합쳐보기','로컬에서 충돌 확인','jisu','병합 충돌 · conflict'),
  resolve: spec('resolve','지수가 해결 문장 보기','지수의 파일 수정','jisu','충돌 해결'),
  'commit-resolution': spec('commit-resolution','지수가 해결 내용 기록하기','지수의 해결 기록','jisu','해결 기록 · commit'),
  'push-resolution': spec('push-resolution','지수가 해결 기록 공유하기','해결 기록 Push','jisu','공유 · push'),
  'approve-resolution': spec('approve-resolution','지수가 해결 기록 승인하기','해결 기록 재검토','pr-happy','재검토 · review'),
  'merge-happy': spec('merge-happy','지수가 결말 PR 합치기','두 번째 병합','pr-happy','합치기 · merge'),
  'pull-mine': spec('pull-mine','내 기준본 받아오기','내 기준본 갱신','mine','받아오기 · pull'),
  'pull-jisu': spec('pull-jisu','지수가 병합 결과 받아오기','지수의 병합 결과 확인','jisu','받아오기 · pull'),
  'assign-proposal': spec('assign-proposal','지수가 제안 이슈를 민수에게 할당하기','민수의 담당 이슈','issues','이슈 할당'),
  'clone-minsu': spec('clone-minsu','민수가 저장소 복제하기','민수의 로컬 준비','minsu','복제 · clone'),
  'branch-proposal': spec('branch-proposal','민수가 제안 작업 공간 만들기','민수의 브랜치','minsu','브랜치 · branch'),
  'edit-proposal': spec('edit-proposal','민수의 제안 문장 보기','민수의 파일 수정','minsu','파일 저장'),
  'commit-proposal': spec('commit-proposal','민수가 제안 기록하기','제안 기록 S','minsu','기록 · commit'),
  'push-proposal': spec('push-proposal','민수가 제안 공유하기','민수의 Push','minsu','공유 · push'),
  'pr-proposal': spec('pr-proposal','민수가 제안 PR 만들기','민수의 PR #33','remote','검토 요청 · PR'),
  'reject-proposal': spec('reject-proposal','지수의 반영 제외 의견 보기','민수 PR 검토 결과','pr-proposal','검토 · 반영 제외'),
  'close-proposal': spec('close-proposal','지수가 민수 PR을 병합 없이 닫기','민수 PR 종료','pr-proposal','닫기 · close without merge'),
  done: spec('done','처음부터 다시 시작하기','완료','remote','실습 완료'),
};
export function lessonSteps(mode) {
  const config=MODES[mode]; if(!config)throw Error('알 수 없는 실습입니다.');
  return [
    ...(config.issues?['assign-story','assign-happy']:[]),...(config.expanded?['assign-proposal']:[]),
    'clone-mine','branch-story','edit-story','commit-story','push-story','pr-story',
    ...(config.feedback?['review-story','revise-story','commit-revision','push-revision']:[]),'approve-story',
    ...(config.issues?['branch-happy','edit-happy','commit-happy','push-happy','pr-happy','approve-happy']:[]),
    ...(config.expanded?['clone-minsu','branch-proposal','edit-proposal','commit-proposal','push-proposal','pr-proposal','reject-proposal','close-proposal']:[]),
    'merge-story',...(config.issues?['clone-jisu','checkout-jisu','inspect-conflict','resolve','commit-resolution','push-resolution','approve-resolution','merge-happy']:[]),
    'pull-mine',...(config.issues?['pull-jisu']:[]),'done',
  ].map(id=>STEPS[id]);
}
export const newWorkshop = (mode='mission') => {
  if(!MODES[mode])throw Error('알 수 없는 실습입니다.');
  return { mode, step:0, history:[], future:[], event:null, repos:{mine:null,jisu:null,...(MODES[mode].expanded?{minsu:null}:{})},
    commits:{B:{id:'B',line:TEXT.base,parents:[]}},
    remote:{main:'B',commits:['B'],branches:{}},
    issues:MODES[mode].issues?[{id:21,branch:'story',title:'일곱 난쟁이와 사는 장면 넣기',assignee:null,status:'open'}, {id:22,branch:'happy',title:'행복한 결말 넣기',assignee:null,status:'open'},...(MODES[mode].expanded?[{id:23,branch:'proposal',title:'백설공주 이야기의 새 장면 제안',assignee:null,status:'open'}]:[])]:[],
    prs:{},conversation:[],resolver:null };
};
export const currentStep = s => lessonSteps(s.mode)[s.step];
const snapshot=s=>{const {history,future,...rest}=s;return structuredClone(rest);};
export const workshopTimeline = s => [...s.history,snapshot(s),...s.future];
const add=(list,id)=>{if(!list.includes(id))list.push(id);};
const requireState=(condition,message)=>{if(!condition)throw Error(message);};
function record(s,id,line,parents){s.commits[id]={id,line,parents};}
function collect(s,id,into){for(const parent of s.commits[id].parents)collect(s,parent,into);add(into,id);}
export function transitionWorkshop(current,action){
  if(action.type==='restart')return newWorkshop(current.mode);
  if(action.type==='navigate'){
    const frames=workshopTimeline(current);
    requireState(Number.isInteger(action.index)&&action.index>=0&&action.index<frames.length,'이미 방문한 단계만 선택할 수 있습니다.');
    return {...structuredClone(frames[action.index]),history:frames.slice(0,action.index),future:frames.slice(action.index+1)};
  }
  const step=currentStep(current);requireState(action.type===step.id,'현재 안내된 동작만 할 수 있습니다.');
  if(step.id==='done')return newWorkshop(current.mode);
  const s=structuredClone(current), mine=s.repos.mine, config=MODES[s.mode];let actor='나';
  const pr=branch=>s.prs[branch];
  const approve=branch=>{requireState(pr(branch)&&pr(branch).status==='open','검토할 PR이 없습니다.');pr(branch).approval={by:'지수',head:pr(branch).head};actor='지수';};
  const merge=branch=>{
    const p=pr(branch);requireState(p&&p.approval?.by==='지수'&&p.approval.head===p.head,'지수가 최신 기록을 승인해야 합칠 수 있습니다.');
    requireState(!(branch==='happy'&&p.head!=='R'),'충돌을 해결한 기록이 필요합니다.');
    const id=branch==='story'?(config.issues?'M1':'M'):'M2';record(s,id,s.commits[p.head].line,[s.remote.main,p.head]);add(s.remote.commits,id);s.remote.main=id;p.status='merged';p.mergedBy='지수';p.mergeCommit=id;
    const issue=s.issues.find(i=>i.branch===branch);if(issue)issue.status='closed';actor='지수';
  };
  switch(step.id){
    case 'assign-story':case 'assign-happy':case 'assign-proposal':s.issues.find(i=>i.branch===step.id.slice(7)).assignee=step.id==='assign-proposal'?'민수':'나';actor='지수';break;
    case 'clone-mine':case 'clone-jisu':case 'clone-minsu':{
      const who=step.id.slice(6);requireState(!s.repos[who],'이미 복제한 저장소입니다.');
      s.repos[who]={main:s.remote.main,commits:[...s.remote.commits],branches:{},active:'main',working:s.commits[s.remote.main].line,dirty:false};actor=who==='jisu'?'지수':who==='minsu'?'민수':'나';break;
    }
    case 'branch-story':case 'branch-happy':{
      requireState(mine,'먼저 내 저장소를 복제해야 합니다.');const name=step.id.slice(7);
      requireState(!mine.branches[name],'이미 있는 작업 공간입니다.');mine.branches[name]=mine.main;mine.active=name;mine.working=s.commits[mine.main].line;break;
    }
    case 'edit-story':requireState(mine?.active==='story','이야기 작업 공간이 필요합니다.');mine.working=config.feedback?TEXT.draft:TEXT.revised;mine.dirty=true;break;
    case 'revise-story':requireState(pr('story')?.review==='changes','지수의 수정 의견이 필요합니다.');mine.working=TEXT.revised;mine.dirty=true;break;
    case 'edit-happy':requireState(mine?.active==='happy','결말 작업 공간이 필요합니다.');mine.working=TEXT.happy;mine.dirty=true;break;
    case 'commit-story':case 'commit-revision':case 'commit-happy':{
      requireState(mine?.dirty,'기록할 파일 변경이 없습니다.');const id=step.id==='commit-story'?'C':step.id==='commit-revision'?'D':'H';
      record(s,id,mine.working,[mine.branches[mine.active]]);add(mine.commits,id);mine.branches[mine.active]=id;mine.dirty=false;break;
    }
    case 'push-story':case 'push-revision':case 'push-happy':{
      const branch=step.id==='push-happy'?'happy':'story',head=mine?.branches[branch];requireState(head&&head!=='B','먼저 변경을 기록해야 합니다.');
      collect(s,head,s.remote.commits);s.remote.branches[branch]=head;
      if(pr(branch)){pr(branch).head=head;pr(branch).approval=null;pr(branch).review='pending';}break;
    }
    case 'pr-story':case 'pr-happy':{
      const branch=step.id.slice(3),head=s.remote.branches[branch];requireState(head,'공유한 기록이 필요합니다.');
      s.prs[branch]={id:branch==='story'?31:32,branch,head,author:'나',reviewer:'지수',approval:null,status:'open',review:'pending',issue:config.issues?(branch==='story'?21:22):null};break;
    }
    case 'review-story':requireState(pr('story'),'검토할 PR이 없습니다.');pr('story').review='changes';actor='지수';s.conversation.push({by:'지수',text:'난쟁이의 수가 빠졌어요. “일곱”을 넣어 주세요.',commit:pr('story').head});break;
    case 'approve-story':approve('story');break;
    case 'approve-happy':approve('happy');break;
    case 'merge-story':merge('story');break;
    case 'checkout-jisu':{
      const jisu=s.repos.jisu;requireState(jisu&&s.remote.branches.happy,'복제한 저장소와 PR 브랜치가 필요합니다.');
      const head=s.remote.branches.happy;collect(s,head,jisu.commits);jisu.branches.happy=head;jisu.active='happy';jisu.working=s.commits[head].line;actor='지수';break;
    }
    case 'inspect-conflict':{
      const jisu=s.repos.jisu;requireState(pr('story')?.status==='merged'&&jisu?.active==='happy','지수의 PR 작업 공간이 필요합니다.');
      s.resolver={status:'comparing',owner:'jisu',base:jisu.main,head:jisu.branches.happy,line:null};jisu.conflicted=true;actor='지수';break;
    }
    case 'resolve':requireState(s.resolver?.status==='comparing','먼저 충돌한 줄을 비교해야 합니다.');s.resolver.line=TEXT.resolved;s.resolver.status='edited';s.repos.jisu.working=TEXT.resolved;s.repos.jisu.dirty=true;s.repos.jisu.conflicted=false;actor='지수';break;
    case 'commit-resolution':{
      requireState(s.resolver?.status==='edited','해결할 내용을 먼저 적용해야 합니다.');const jisu=s.repos.jisu;
      record(s,'R',jisu.working,[jisu.branches.happy,jisu.main]);add(jisu.commits,'R');jisu.branches.happy='R';jisu.dirty=false;s.resolver.status='recorded';actor='지수';break;
    }
    case 'push-resolution':{
      requireState(s.repos.jisu?.branches.happy==='R','지수의 로컬 해결 기록 R이 필요합니다.');collect(s,'R',s.remote.commits);s.remote.branches.happy='R';pr('happy').head='R';pr('happy').approval=null;pr('happy').review='pending';pr('happy').updatedBy='지수';s.resolver.status='shared';actor='지수';break;
    }
    case 'branch-proposal':requireState(s.repos.minsu,'민수의 저장소가 필요합니다.');s.repos.minsu.branches.proposal=s.repos.minsu.main;s.repos.minsu.active='proposal';actor='민수';break;
    case 'edit-proposal':s.repos.minsu.working=TEXT.proposal;s.repos.minsu.dirty=true;actor='민수';break;
    case 'commit-proposal':record(s,'S',s.repos.minsu.working,[s.repos.minsu.branches.proposal]);add(s.repos.minsu.commits,'S');s.repos.minsu.branches.proposal='S';s.repos.minsu.dirty=false;actor='민수';break;
    case 'push-proposal':collect(s,'S',s.remote.commits);s.remote.branches.proposal='S';actor='민수';break;
    case 'pr-proposal':s.prs.proposal={id:33,branch:'proposal',head:'S',author:'민수',reviewer:'지수',approval:null,status:'open',review:'pending',issue:23};actor='민수';break;
    case 'reject-proposal':requireState(pr('proposal')?.status==='open','민수의 열린 PR이 필요합니다.');pr('proposal').review='excluded';pr('proposal').reason='이 저장소는 백설공주 이야기입니다. 신데렐라 장면은 이번 범위에서 제외합니다.';actor='지수';break;
    case 'close-proposal':requireState(pr('proposal')?.review==='excluded','먼저 지수의 검토가 필요합니다.');pr('proposal').status='closed';pr('proposal').closedBy='지수';actor='지수';break;
    case 'approve-resolution':requireState(pr('happy')?.head==='R','해결 기록 R이 필요합니다.');approve('happy');break;
    case 'merge-happy':merge('happy');break;
    case 'pull-mine':case 'pull-jisu':{
      const who=step.id.slice(5),repo=s.repos[who];requireState(repo,'복제한 저장소가 필요합니다.');collect(s,s.remote.main,repo.commits);repo.main=s.remote.main;repo.active='main';repo.working=s.commits[repo.main].line;repo.dirty=false;actor=who==='jisu'?'지수':who==='minsu'?'민수':'나';break;
    }
  }
  s.event={type:step.id,actor};s.step++;s.history=[...current.history,snapshot(current)];s.future=[];return s;
}
export function prStatus(s,branch){
  const p=s.prs[branch];if(!p)return 'none';if(p.status==='merged')return 'merged';if(p.status==='closed')return 'closed';if(p.review==='excluded')return 'excluded';
  if(branch==='happy'&&s.prs.story?.status==='merged'&&p.head!=='R')return 'conflict';
  if(p.approval?.by==='지수'&&p.approval.head===p.head)return 'approved';
  return p.review==='changes'?'changes':'review';
}
export function observation(s){
  const key=s.event?.type,main=s.remote.main;
  const messages={
    'assign-story':'지수가 이슈 #21의 담당자를 나로 지정했습니다. 아직 파일이나 저장소는 생기지 않았습니다.',
    'assign-happy':'지수가 이슈 #22도 내게 할당했습니다. 각 이슈는 별도 브랜치에서 작업합니다.',
    'clone-mine':'내 컴퓨터에 프로젝트 폴더와 .git 폴더가 생겼습니다. 기록 B를 GitHub에서 복제했습니다.',
    'clone-jisu':'지수가 충돌을 해결하려고 저장소를 복제했습니다. 최신 main M1과 PR의 기록 H를 받았습니다.',
    'checkout-jisu':'지수가 로컬 happy 브랜치를 열었습니다. happy는 H, main은 M1입니다.',
    'branch-story':'story 브랜치가 기록 B를 가리킵니다. 새 폴더나 기록을 만드는 동작은 아닙니다.',
    'edit-story':'내 작업 파일만 저장했습니다. 기준본 B와 GitHub의 파일은 그대로입니다.',
    'commit-story':'초안 기록 C를 만들었습니다. C는 내 저장소에만 있습니다.',
    'push-story':'기록 C를 GitHub 저장소에 복사했습니다. 내 저장소의 C도 남아 있습니다.',
    'pr-story':'내가 이야기 PR #31을 만들었습니다. 검토 담당자는 지수입니다.',
    'review-story':'지수가 “일곱”을 추가해 달라는 의견을 남겼습니다. 파일은 아직 바뀌지 않았습니다.',
    'revise-story':'정해진 수정 문장을 파일에 저장했습니다. 이전 기록 C는 그대로입니다.',
    'commit-revision':'수정한 파일을 기록 D로 남겼습니다. C와 D를 각각 볼 수 있습니다.',
    'push-revision':'기존 PR #31에 D가 추가됐습니다. 지수는 새 기록을 다시 검토합니다.',
    'approve-story':'지수가 이야기 PR의 최신 기록을 승인했습니다. 기준본은 아직 B입니다.',
    'branch-happy':'내 기준본 B에서 happy 브랜치를 만들었습니다. story와 다른 작업 공간입니다.',
    'edit-happy':'happy 브랜치에서 같은 줄을 다르게 고쳤습니다. story의 변경은 그대로입니다.',
    'commit-happy':'결말 기록 H를 만들었습니다. H는 내 저장소에만 있습니다.',
    'push-happy':'기록 H도 GitHub에 복사했습니다. 두 작업 브랜치가 따로 존재합니다.',
    'pr-happy':'내가 결말 PR #32를 만들었습니다. 두 PR 모두 main을 대상으로 합니다.',
    'approve-happy':'지수가 결말 PR도 승인했습니다. 두 PR은 현재 기준본 B와 각각 비교됩니다.',
    'merge-story':MODES[s.mode].issues?'지수가 PR #31을 합쳐 기준본이 M1이 됐습니다. 남은 PR #32는 새 기준본과 같은 줄을 다르게 고쳐 충돌합니다.':'지수가 PR #31을 기준본 M으로 합쳤습니다. 내 컴퓨터의 기준본은 아직 B입니다.',
    'inspect-conflict':'지수의 로컬에서 main M1을 happy H에 합치다가 충돌했습니다. GitHub는 아직 바뀌지 않았습니다.',
    resolve:'지수가 자기 파일의 충돌을 해결했습니다. 아직 기록 전이며 GitHub의 H는 그대로입니다.',
    'commit-resolution':'R은 지수의 로컬 happy에만 있습니다. GitHub의 PR은 아직 H입니다.',
    'push-resolution':'지수가 R을 Push했습니다. GitHub의 같은 PR #32가 R로 갱신됐습니다.',
    'approve-resolution':'지수가 해결 기록 R을 다시 검토하고 승인했습니다.',
    'merge-happy':'지수가 PR #32를 합쳤습니다. 기준본 M2에 두 요청의 내용이 함께 있습니다.',
    'pull-mine':`내 저장소가 병합 결과 ${main}을 받아왔습니다.`,
    'pull-jisu':`지수도 main에서 병합 결과 ${main}을 확인했습니다. 로컬 happy의 해결 기록 R도 남아 있습니다.`,
    'assign-proposal':'지수가 새 장면 제안 이슈를 민수에게 할당했습니다.',
    'clone-minsu':'민수가 자기 컴퓨터에 저장소를 복제했습니다.',
    'branch-proposal':'민수가 proposal 브랜치를 만들었습니다. 기준본은 그대로입니다.',
    'edit-proposal':'민수가 신데렐라 장면을 제안 파일에 저장했습니다.',
    'commit-proposal':'민수의 로컬에 제안 기록 S가 생겼습니다.',
    'push-proposal':'민수가 S를 공유했습니다. GitHub의 기준본은 바뀌지 않았습니다.',
    'pr-proposal':'민수가 PR #33을 만들었습니다. 지수의 검토를 기다립니다.',
    'reject-proposal':'지수는 신데렐라 장면이 백설공주 프로젝트의 범위에 맞지 않아 반영하지 않기로 했습니다.',
    'close-proposal':'지수가 PR #33을 병합 없이 닫았습니다. 기록 S는 남지만 기준본에는 들어가지 않습니다.',
  };
  return {title:key?STEPS[key].title:'시작 상태',detail:messages[key]||'GitHub에만 저장소가 있습니다. 각 컴퓨터에는 아직 로컬 저장소가 없습니다.',concept:key?STEPS[key].concept:'B는 파일명이 아니라 저장된 상태를 가리키는 기록 이름입니다.'};
}
export const documentLines=line=>['# 백설공주','백설공주는 숲속의 집에 도착했습니다.',line];
export function fileEdit(s){
  const id=currentStep(s).id;
  if(id==='resolve')return {before:s.commits[s.resolver.head].line,base:s.commits[s.resolver.base].line,after:TEXT.resolved,title:'지수의 컴퓨터 · happy 충돌 해결'};
  if(!['edit-story','revise-story','edit-happy','edit-proposal'].includes(id))return null;
  if(id==='edit-proposal')return {before:s.repos.minsu.working,after:TEXT.proposal,title:'민수가 제안하는 문장'};
  return {before:s.repos.mine.working,after:id==='edit-happy'?TEXT.happy:id==='revise-story'||!MODES[s.mode].feedback?TEXT.revised:TEXT.draft,
    title:id==='revise-story'?'지수의 의견을 반영한 본문':'파일에 저장할 본문'};
}
