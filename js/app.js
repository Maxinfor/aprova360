/* ==========================================================
   APROVAÇÃO 360 - APP CORRIGIDO
   ========================================================== */

class Aprovacao360 {
    constructor() {
        this.disciplinas = [];
        this.filtroAtual = 'all';
        this.modoView = 'grid';
        this.editandoId = null;
        this.notificacoes = [];
        this.init();
    }

    init() {
        this.cacheDOM();
        this.carregarDados();
        this.configurarEventos();
        this.renderizar();
        this.atualizarDataHora();
        
        console.log('🚀 APROVAÇÃO 360 carregado!');
        console.log(`📊 ${this.disciplinas.length} disciplinas`);
        
        setInterval(() => this.atualizarDataHora(), 60000);
    }

    cacheDOM() {
        this.dom = {
            sidebar: document.getElementById('sidebar'),
            btnToggle: document.getElementById('toggleSidebar'),
            btnMenu: document.getElementById('btnMenu'),
            listaDisciplinas: document.getElementById('listaDisciplinas'),
            
            discName: document.getElementById('discName'),
            btnAdd: document.getElementById('btnAddDisc'),
            
            filters: document.querySelectorAll('.filter'),
            
            totalDisciplinas: document.getElementById('totalDisciplinas'),
            progressoGeral: document.getElementById('progressoGeral'),
            totalConcluidas: document.getElementById('totalConcluidas'),
            statTotal: document.getElementById('statTotal'),
            statConcluidas: document.getElementById('statConcluidas'),
            statPendentes: document.getElementById('statPendentes'),
            statProgresso: document.getElementById('statProgresso'),
            
            progressoBar: document.getElementById('progressoBar'),
            progressoTexto: document.getElementById('progressoTexto'),
            
            disciplinasGrid: document.getElementById('disciplinasGrid'),
            emptyState: document.getElementById('emptyState'),
            viewGrid: document.getElementById('viewGrid'),
            viewList: document.getElementById('viewList'),
            
            mensagemContainer: document.getElementById('mensagemContainer'),
            
            modalEditar: document.getElementById('modalEditar'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            modalCancel: document.getElementById('modalCancel'),
            modalSave: document.getElementById('modalSave'),
            editDiscName: document.getElementById('editDiscName'),
            
            btnNotification: document.getElementById('btnNotification'),
            notifBadge: document.getElementById('notifBadge'),
            btnLimparTudo: document.getElementById('btnLimparTudo'),
            currentDate: document.getElementById('currentDate'),
        };
    }

    carregarDados() {
        try {
            const dados = localStorage.getItem('aprovacao360_data');
            if (dados) {
                const parsed = JSON.parse(dados);
                this.disciplinas = parsed.disciplinas || [];
                this.notificacoes = parsed.notificacoes || [];
            }
        } catch (e) {
            console.error('Erro ao carregar:', e);
            this.disciplinas = [];
            this.notificacoes = [];
        }
    }

    salvarDados() {
        try {
            localStorage.setItem('aprovacao360_data', JSON.stringify({
                disciplinas: this.disciplinas,
                notificacoes: this.notificacoes.slice(0, 50)
            }));
        } catch (e) {
            console.error('Erro ao salvar:', e);
        }
    }

    adicionar(nome) {
        nome = nome.trim();
        if (!nome) {
            this.mostrarMensagem('Digite o nome da disciplina!', 'error');
            return false;
        }
        if (nome.length < 2) {
            this.mostrarMensagem('Mínimo 2 caracteres!', 'error');
            return false;
        }
        if (this.disciplinas.some(d => d.nome.toLowerCase() === nome.toLowerCase())) {
            this.mostrarMensagem(`"${nome}" já existe!`, 'error');
            return false;
        }

        this.disciplinas.unshift({
            id: Date.now(),
            nome: nome,
            concluido: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        });

        this.salvarDados();
        this.renderizar();
        this.mostrarMensagem(`"${nome}" adicionada! 🎉`, 'success');
        this.confetti();
        return true;
    }

    toggleConcluido(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        disc.concluido = !disc.concluido;
        disc.dataConclusao = disc.concluido ? new Date().toISOString() : null;
        this.salvarDados();
        this.renderizar();

        if (disc.concluido) {
            this.mostrarMensagem(`"${disc.nome}" concluída! 🎯`, 'success');
            this.confetti();
        }
    }

    editar(id, novoNome) {
        novoNome = novoNome.trim();
        if (!novoNome || novoNome.length < 2) {
            this.mostrarMensagem('Nome inválido!', 'error');
            return false;
        }

        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return false;

        if (this.disciplinas.some(d => d.id !== id && d.nome.toLowerCase() === novoNome.toLowerCase())) {
            this.mostrarMensagem(`"${novoNome}" já existe!`, 'error');
            return false;
        }

        disc.nome = novoNome;
        this.salvarDados();
        this.renderizar();
        this.mostrarMensagem(`Atualizado para "${novoNome}"`, 'info');
        return true;
    }

    remover(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;
        if (confirm(`Remover "${disc.nome}"?`)) {
            this.disciplinas = this.disciplinas.filter(d => d.id !== id);
            this.salvarDados();
            this.renderizar();
            this.mostrarMensagem(`"${disc.nome}" removida`, 'info');
        }
    }

    limparTudo() {
        if (this.disciplinas.length === 0) {
            this.mostrarMensagem('Nenhuma disciplina para limpar', 'info');
            return;
        }
        if (confirm('⚠️ Remover TODAS as disciplinas?')) {
            this.disciplinas = [];
            this.notificacoes = [];
            this.salvarDados();
            this.renderizar();
            this.mostrarMensagem('Todas removidas!', 'info');
        }
    }

    getDisciplinasFiltradas() {
        let filtradas = [...this.disciplinas];
        if (this.filtroAtual === 'pending') {
            filtradas = filtradas.filter(d => !d.concluido);
        } else if (this.filtroAtual === 'completed') {
            filtradas = filtradas.filter(d => d.concluido);
        }
        return filtradas;
    }

    renderizar() {
        this.renderizarLista();
        this.renderizarGrid();
        this.renderizarStats();
        this.atualizarProgresso();
        this.atualizarVazia();
        this.atualizarBadge();
    }

    renderizarLista() {
        const container = this.dom.listaDisciplinas;
        const filtradas = this.getDisciplinasFiltradas();

        if (filtradas.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mini">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma disciplina ${this.filtroAtual === 'all' ? 'cadastrada' : 
                        this.filtroAtual === 'pending' ? 'pendente' : 'concluída'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtradas.map(d => `
            <div class="disc-item">
                <div class="disc-item-left">
                    <input type="checkbox" class="disc-item-checkbox" 
                           ${d.concluido ? 'checked' : ''} 
                           onchange="app.toggleConcluido(${d.id})">
                    <span class="disc-item-name ${d.concluido ? 'done' : ''}">${this.escapeHTML(d.nome)}</span>
                </div>
                <div class="disc-item-actions">
                    <button class="btn-action edit" onclick="app.abrirModal(${d.id})"><i class="fas fa-pen"></i></button>
                    <button class="btn-action delete" onclick="app.remover(${d.id})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }

    renderizarGrid() {
        const container = this.dom.disciplinasGrid;
        const filtradas = this.getDisciplinasFiltradas();

        if (filtradas.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.className = `grid-container ${this.modoView === 'list' ? 'list' : ''}`;

        container.innerHTML = filtradas.map(d => `
            <div class="grid-item ${d.concluido ? 'done' : ''}">
                <div class="grid-item-header">
                    <span class="grid-item-name">${this.escapeHTML(d.nome)}</span>
                    <span class="grid-item-status ${d.concluido ? 'status-done' : 'status-pending'}">
                        ${d.concluido ? '✅' : '⏳'}
                    </span>
                </div>
                <div class="grid-item-actions">
                    <button class="btn-action" onclick="app.toggleConcluido(${d.id})">
                        <i class="fas ${d.concluido ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-action edit" onclick="app.abrirModal(${d.id})">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-action delete" onclick="app.remover(${d.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderizarStats() {
        const total = this.disciplinas.length;
        const concluidas = this.disciplinas.filter(d => d.concluido).length;
        const pendentes = total - concluidas;
        const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        this.dom.statTotal.textContent = total;
        this.dom.statConcluidas.textContent = concluidas;
        this.dom.statPendentes.textContent = pendentes;
        this.dom.statProgresso.textContent = progresso + '%';
        this.dom.totalConcluidas.textContent = `${concluidas}/${total}`;
        this.dom.progressoGeral.textContent = progresso + '%';
    }

    atualizarProgresso() {
        const total = this.disciplinas.length;
        const concluidas = this.disciplinas.filter(d => d.concluido).length;
        const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        this.dom.progressoBar.style.width = progresso + '%';
        this.dom.progressoTexto.textContent = progresso + '%';
    }

    atualizarVazia() {
        const empty = this.dom.emptyState;
        if (this.disciplinas.length === 0) {
            empty.classList.add('show');
        } else {
            empty.classList.remove('show');
        }
    }

    atualizarBadge() {
        this.dom.totalDisciplinas.textContent = this.disciplinas.length;
    }

    abrirModal(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        this.editandoId = id;
        this.dom.editDiscName.value = disc.nome;
        this.dom.modalEditar.classList.add('show');
        this.dom.modalOverlay.classList.add('show');
        
        setTimeout(() => {
            this.dom.editDiscName.focus();
            this.dom.editDiscName.select();
        }, 150);
    }

    fecharModal() {
        this.dom.modalEditar.classList.remove('show');
        this.dom.modalOverlay.classList.remove('show');
        this.editandoId = null;
        this.dom.editDiscName.value = '';
    }

    salvarEdicao() {
        const nome = this.dom.editDiscName.value.trim();
        if (this.editandoId && nome) {
            this.editar(this.editandoId, nome);
            this.fecharModal();
        } else {
            this.mostrarMensagem('Digite um nome válido!', 'error');
        }
    }

    mostrarMensagem(texto, tipo = 'info') {
        const container = this.dom.mensagemContainer;
        if (!container) return;

        const cores = {
            success: 'success',
            error: 'error',
            info: 'info'
        };

        const icones = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-circle-info'
        };

        const msg = document.createElement('div');
        msg.className = `message ${cores[tipo] || 'info'}`;
        msg.innerHTML = `
            <i class="fas ${icones[tipo] || icones.info}"></i>
            <span>${texto}</span>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(msg);

        setTimeout(() => {
            if (msg.parentElement) {
                msg.style.opacity = '0';
                msg.style.transform = 'translateY(-10px)';
                setTimeout(() => msg.remove(), 300);
            }
        }, 4000);
    }

    confetti() {
        const emojis = ['🎉', '✨', '⭐', '🎊', '🌟'];
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.cssText = `
                    position: fixed;
                    font-size: ${18 + Math.random() * 20}px;
                    left: ${10 + Math.random() * 80}%;
                    top: -20px;
                    pointer-events: none;
                    z-index: 9999;
                    animation: fall ${1 + Math.random() * 1.5}s ease-in forwards;
                `;
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 3000);
            }, i * 80);
        }

        if (!document.getElementById('confettiStyle')) {
            const style = document.createElement('style');
            style.id = 'confettiStyle';
            style.textContent = `
                @keyframes fall {
                    0% { opacity: 1; transform: translateY(0) rotate(0deg); }
                    100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    escapeHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    atualizarDataHora() {
        const now = new Date();
        const opcoes = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.dom.currentDate.textContent = now.toLocaleDateString('pt-BR', opcoes);
    }

    configurarEventos() {
        // Adicionar
        this.dom.btnAdd.addEventListener('click', () => {
            this.adicionar(this.dom.discName.value);
            this.dom.discName.value = '';
            this.dom.discName.focus();
        });

        this.dom.discName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adicionar(this.dom.discName.value);
                this.dom.discName.value = '';
            }
        });

        // Filtros
        this.dom.filters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filtroAtual = btn.dataset.filter;
                this.renderizar();
            });
        });

        // Views
        this.dom.viewGrid.addEventListener('click', () => {
            this.modoView = 'grid';
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.dom.viewGrid.classList.add('active');
            this.renderizarGrid();
        });

        this.dom.viewList.addEventListener('click', () => {
            this.modoView = 'list';
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.dom.viewList.classList.add('active');
            this.renderizarGrid();
        });

        // Sidebar
        this.dom.btnMenu.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('open');
        });

        this.dom.btnToggle.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('collapsed');
            const icon = this.dom.btnToggle.querySelector('i');
            icon.classList.toggle('fa-chevron-left');
            icon.classList.toggle('fa-chevron-right');
        });

        // Modal
        this.dom.modalClose.addEventListener('click', () => this.fecharModal());
        this.dom.modalCancel.addEventListener('click', () => this.fecharModal());
        this.dom.modalOverlay.addEventListener('click', () => this.fecharModal());
        this.dom.modalSave.addEventListener('click', () => this.salvarEdicao());
        
        this.dom.editDiscName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.salvarEdicao();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.fecharModal();
        });

        // Limpar
        this.dom.btnLimparTudo.addEventListener('click', () => {
            this.limparTudo();
        });

        // Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
                e.preventDefault();
                this.dom.discName.focus();
                this.dom.discName.select();
            }
        });

        setTimeout(() => this.dom.discName.focus(), 500);
    }
}

const app = new Aprovacao360();
window.app = app;
