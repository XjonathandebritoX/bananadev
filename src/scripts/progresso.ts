import { progressStore } from '../lib/progress/browser';
import type { DisciplineStatus } from '../lib/curriculum/types';
import { initProgressUI } from './progress-ui';

interface IndexDiscipline {
  id: string;
  title: string;
  href: string;
  semester: number;
  hours: number;
}

interface IndexProject {
  id: string;
  title: string;
  semester: number;
  hours: number;
}

function readIndex(): { disciplines: IndexDiscipline[]; projects: IndexProject[] } {
  const element = document.getElementById('bd-progress-index');
  if (!element?.textContent) return { disciplines: [], projects: [] };
  try {
    return JSON.parse(element.textContent) as { disciplines: IndexDiscipline[]; projects: IndexProject[] };
  } catch {
    return { disciplines: [], projects: [] };
  }
}

function createDisciplineLink(item: IndexDiscipline, status: DisciplineStatus): HTMLLIElement {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'resource';
  link.href = item.href;

  const text = document.createElement('span');
  text.className = 'resource__text';

  const label = document.createElement('span');
  label.className = 'resource__label';
  label.textContent = item.title;

  const meta = document.createElement('span');
  meta.className = 'resource__meta';
  meta.textContent = `${item.semester}º semestre · ${item.hours}h · ${status === 'in-progress' ? 'em andamento' : 'não iniciada'}`;

  text.append(label, meta);
  link.append(text);
  li.append(link);
  return li;
}

export function initProgressPage(): void {
  initProgressUI();
  const store = progressStore();
  const index = readIndex();

  const continueEmpty = document.querySelector<HTMLElement>('[data-continue-empty]');
  const continueContent = document.querySelector<HTMLElement>('[data-continue-content]');
  const continueTitle = document.querySelector<HTMLElement>('[data-continue-title]');
  const continueMeta = document.querySelector<HTMLElement>('[data-continue-meta]');
  const continueLink = document.querySelector<HTMLAnchorElement>('[data-continue-link]');
  const nextList = document.querySelector<HTMLElement>('[data-next-list]');
  const projectTitle = document.querySelector<HTMLElement>('[data-next-project-title]');
  const projectMeta = document.querySelector<HTMLElement>('[data-next-project-meta]');
  const projectSemester = document.querySelector<HTMLElement>('[data-next-project-semester]');
  const lastUpdate = document.querySelector<HTMLElement>('[data-last-update]');

  const render = () => {
    const state = store.snapshot();
    const byId = new Map(index.disciplines.map((item) => [item.id, item]));

    const last = state.lastVisited ? byId.get(state.lastVisited) : undefined;
    if (last && continueContent && continueTitle && continueMeta && continueLink && continueEmpty) {
      continueEmpty.hidden = true;
      continueContent.hidden = false;
      continueTitle.textContent = last.title;
      continueMeta.textContent = `${last.semester}º semestre · ${last.hours}h`;
      continueLink.href = last.href;
    } else if (continueContent && continueEmpty) {
      continueEmpty.hidden = false;
      continueContent.hidden = true;
    }

    if (nextList) {
      nextList.innerHTML = '';
      const pending = index.disciplines
        .filter((item) => store.statusOf('discipline', item.id) !== 'completed')
        .slice(0, 3);
      if (pending.length === 0) {
        const li = document.createElement('li');
        li.className = 'text-sm muted';
        li.textContent = 'Todas as disciplinas concluídas. Hora de revisar o portfólio!';
        nextList.append(li);
      }
      for (const item of pending) {
        nextList.append(createDisciplineLink(item, store.statusOf('discipline', item.id)));
      }
    }

    const nextProject = index.projects.find((project) => store.statusOf('project', project.id) !== 'completed');
    if (projectTitle && projectMeta && projectSemester) {
      if (nextProject) {
        projectTitle.textContent = nextProject.title;
        projectMeta.textContent = `${nextProject.hours}h · marque como concluído na página de projetos`;
        projectSemester.textContent = `Projeto Integrador · ${nextProject.semester}º semestre`;
      } else {
        projectTitle.textContent = 'Todos os projetos concluídos';
        projectMeta.textContent = 'Mantenha o portfólio atualizado e contribua em repositórios de terceiros.';
        projectSemester.textContent = 'Formação completa';
      }
    }

    if (lastUpdate) {
      const entries = [...Object.values(state.disciplines), ...Object.values(state.projects)];
      const dates = entries
        .map((entry) => Date.parse(entry.updatedAt))
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => b - a);
      lastUpdate.textContent =
        dates.length > 0
          ? new Date(dates[0]).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
          : 'nenhuma alteração registrada';
    }
  };

  store.subscribe(render);
  render();

  const status = document.querySelector<HTMLElement>('[data-import-status]');

  const setStatus = (message: string, tone: 'ok' | 'error' | 'muted' = 'muted') => {
    if (!status) return;
    status.textContent = message;
    status.style.color = tone === 'error' ? 'var(--danger)' : tone === 'ok' ? 'var(--success)' : 'var(--ink-3)';
  };

  document.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `bananadev-progresso-${date}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Backup exportado. Guarde o arquivo em um lugar seguro.', 'ok');
  });

  const importInput = document.querySelector<HTMLInputElement>('[data-import]');
  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setStatus('Arquivo muito grande para ser um backup de progresso.', 'error');
      importInput.value = '';
      return;
    }
    try {
      const text = await file.text();
      const result = store.importJson(text);
      if (result.ok) {
        const count =
          Object.keys(result.state.disciplines).length + Object.keys(result.state.projects).length;
        setStatus(`Backup importado: ${count} registros restaurados.`, 'ok');
        render();
      } else {
        setStatus(result.error, 'error');
      }
    } catch {
      setStatus('Não foi possível ler o arquivo selecionado.', 'error');
    }
    importInput.value = '';
  });

  const dialog = document.querySelector<HTMLDialogElement>('#clear-dialog');
  document.querySelector('[data-open-clear]')?.addEventListener('click', () => {
    if (dialog?.showModal) dialog.showModal();
    else if (window.confirm('Limpar todo o progresso salvo neste navegador?')) {
      store.clear();
      setStatus('Progresso apagado deste navegador.', 'muted');
    }
  });

  document.querySelector('[data-confirm-clear]')?.addEventListener('click', () => {
    store.clear();
    render();
    setStatus('Progresso apagado deste navegador.', 'muted');
  });
}
