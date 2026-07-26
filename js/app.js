/* ==========================================================
   APROVAÇÃO 360 - SISTEMA DE GESTÃO DE ESTUDOS
   ========================================================== */

class App {
    constructor() {
        this.disciplinas = [];
        this.filtroAtual = 'all';
        this.modoView = 'grid';
        this.editandoId = null;
        this.init();
    }

    init() {
        this.carregarDados();
        this.renderizar();
        this.configurarEventos();
        this.atualizarDataHora();
        this.atualizarEstatisticas();
    }

    // ==========================================
    // GERENCIAMENTO DE DADOS
    // ==========================================
    carregarDados() {
        try {
            const dados = localStorage.getItem('aprovacao360_disciplinas');
            this.disciplinas = dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.disciplinas = [];
        }
    }

    salvarDados() {
        try {
            localStorage.setItem('aprovacao360_disciplinas', JSON.stringify(this.disciplinas));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.mostrarMensagem('Erro ao salvar dados!', 'error');
        }
    }

    // ==========================================
    // CRUD
    // ==========================================
    adicionar(nome) {
        nome = nome.trim();
        if (!nome) {
            this.mostrarMensagem('Digite o nome da disciplina!', 'error');
            return false;
        }

        if (nome.length < 2) {
            this.mostrarMensagem('O nome deve ter pelo menos 2 caracteres!', 'error');
            return false;
        }

        // Verifica duplicata
        if (this.disciplinas.some(d => d.nome.toLowerCase() === nome.toLowerCase())) {
            this.mostrarMensagem('Esta disciplina já existe!', 'error');
            return false;
        }

        const disciplina = {
            id: Date.now(),
            nome: nome,
            concluido: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        };

        this.disciplinas.push(disciplina);
        this.salvarDados();
        this.renderizar();
        this.atualizarEstatisticas();
        this.mostrarMensagem(`"${nome}" adicionada com sucesso! 🎉`, 'success');
        
        // Animação de confete
        this.confettiEfeito();
        return true;
    }

    toggleConcluido(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        disc.concluido = !disc.concluido;
        disc.dataConclusao = disc.concluido ? new Date().toISOString() : null;
        this.salvarDados();
        this.renderizar();
        this.atualizarEstatisticas();

        if (disc.concluido) {
            this.mostrarMensagem(`"${disc.nome}" concluída! 🎯`, 'success');
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

        // Verifica duplicata (exceto ela mesma)
        const duplicada = this.disciplinas.some(d => 
            d.id !== id && d.nome.toLowerCase() === novoNome.toLowerCase()
        );
        if (duplicada) {
            this.mostrarMensagem('Já existe uma disciplina com este nome!', 'error');
            return false;
        }

        disc.nome = novoNome;
        this.salvarDados();
        this.renderizar();
        this.mostrarMensagem(`Disciplina atualizada para "${novoNome}"`, 'info');
        return true;
    }

    remover(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        if (confirm(`Tem certeza que deseja remover "${disc.nome}"?`)) {
            this.disciplinas = this.disciplinas.filter(d => d.id !== id);
            this.salvarDados();
            this.renderizar();
            this.atualizarEstatisticas();
            this.mostrarMensagem(`"${disc.nome}" removida`, 'info');
        }
    }

    limparTudo() {
        if (this.disciplinas.length === 0) {
            this.mostrarMensagem('Não há disciplinas para limpar!', 'info');
            return;
        }

        if (confirm('Tem certeza que deseja remover TODAS as disciplinas?')) {
            this.disciplinas = [];
            this.salvarDados();
            this.renderizar();
            this.atualizarEstatisticas();
            this.mostrarMensagem('Todas as disciplinas foram removidas!', 'info');
        }
    }

    // ==========================================
    // FILTROS
    // ==========================================
    getDisciplinasFiltradas() {
        switch (this.filtroAtual) {
            case 'pending':
                return this.disciplinas.filter(d => !d.concluido);
            case 'completed':
                return this.disciplinas.filter(d => d.concluido);
            default:
                return [...this.disciplinas];
        }
    }

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================
    renderizar() {
        this.renderizarLista();
        this.renderizarGrid();
        this.renderizarBadges();
        this.renderizarEstatisticas();
        this.atualizarProgresso();
        this.atualizarVazia();
    }

    renderizarLista() {
        const container = document.getElementById('listaDisciplinas');
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
            <div class="disc-item" data-id="${d.id}">
                <div class="disc-item-left">
                    <input type="checkbox" 
                           class="disc-item-checkbox" 
                           ${d.concluido ? 'checked' : ''} 
                           onchange="app.toggleConcluido(${d.id})"
                           aria-label="Marcar como concluído">
                    <span class="disc-item-name ${d.concluido ? 'concluido' : ''}">${this.escapeHTML(d.nome)}</span>
                </div>
                <div class="disc-item-actions">
                    <button class="btn-action edit" onclick="app.abrirModalEditar(${d.id})" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-action delete" onclick="app.remover(${d.id})" title="Remover">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderizarGrid() {
        const container = document.getElementById('disciplinasGrid');
        const filtradas = this.getDisciplinasFiltradas();

        if (filtradas.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.className = `disciplinas-grid-container ${this.modoView}-view`;

        container.innerHTML = filtradas.map(d => `
            <div class="grid-item ${d.concluido ? 'concluido' : ''}">
                <div class="grid-item-header">
                    <span class="grid-item-name">${this.escapeHTML(d.nome)}</span>
                    <span class="grid-item-status ${d.concluido ? 'status-concluido' : 'status-pendente'}">
                        ${d.concluido ? '✅ Concluída' : '⏳ Pendente'}
                    </span>
                </div>
                <div class="grid-item-actions">
                    <button class="btn-action edit" onclick="app.toggleConcluido(${d.id})" title="Alternar status">
                        <i class="fas ${d.concluido ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-action edit" onclick="app.abrirModalEditar(${d.id})" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-action delete" onclick="app.remover(${d.id})" title="Remover">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderizarBadges() {
        const total = document.getElementById('totalDisciplinas');
        if (total) {
            total.textContent = this.disciplinas.length;
        }
    }

    renderizarEstatisticas() {
        const total = this.disciplinas.length;
        const concluidas = this.disciplinas.filter(d => d.concluido).length;
        const pendentes = total - concluidas;
        const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statConcluidas').textContent = concluidas;
        document.getElementById('statPendentes').textContent = pendentes;
        document.getElementById('statProgresso').textContent = progresso + '%';
        document.getElementById('totalConcluidas').textContent = `${concluidas}/${total}`;
    }

    atualizarProgresso() {
        const total = this.disciplinas.length;
        const concluidas = this.disciplinas.filter(d => d.concluido).length;
        const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        document.getElementById('progressoBar').style.width = progresso + '%';
        document.getElementById('progressoTexto').textContent = progresso + '%';
        document.getElementById('progressoGeral').textContent = progresso + '%';
    }

    atualizarVazia() {
        const empty = document.getElementById('emptyState');
        if (empty) {
            empty.className = 'empty-state' + (this.disciplinas.length === 0 ? ' show' : '');
        }
    }

    // ==========================================
    // MODAL
    // ==========================================
    abrirModalEditar(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        this.editandoId = id;
        document.getElementById('editDiscName').value = disc.nome;
        document.getElementById('modalEditar').classList.add('show');
        document.getElementById('modalOverlay').classList.add('show');
        
        // Foco no input
        setTimeout(() => {
            document.getElementById('editDiscName').focus();
            document.getElementById('editDiscName').select();
        }, 100);
    }

    fecharModal() {
        document.getElementById('modalEditar').classList.remove('show');
        document.getElementById('modalOverlay').classList.remove('show');
        this.editandoId = null;
        document.getElementById('editDiscName').value = '';
    }

    salvarEdicao() {
        const nome = document.getElementById('editDiscName').value;
        if (this.editandoId && nome) {
            this.editar(this.editandoId, nome);
            this.fecharModal();
        }
    }

    // ==========================================
    // MENSAGENS
    // ==========================================
    mostrarMensagem(texto, tipo = 'info') {
        const container = document.getElementById('mensagemContainer');
        if (!container) return;

        const icones = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const mensagem = document.createElement('div');
        mensagem.className = `mensagem ${tipo}`;
        mensagem.innerHTML = `
            <i class="fas ${icones[tipo] || icones.info}"></i>
            <span>${texto}</span>
            <button class="mensagem-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(mensagem);

        // Auto-remove após 4 segundos
        setTimeout(() => {
            if (mensagem.parentElement) {
                mensagem.remove();
            }
        }, 4000);
    }

    // ==========================================
    // CONFETTI (Efeito de celebração)
    // ==========================================
    confettiEfeito() {
        if (typeof confetti === 'undefined') {
            // Carrega confetti.js se disponível
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
            document.head.appendChild(script);
            script.onload = () => this._dispararConfetti();
        } else {
            this._dispararConfetti();
        }
    }

    _dispararConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 }
            });
        }
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================
    escapeHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    atualizarDataHora() {
        const dataElement = document.getElementById('currentDate');
        if (dataElement) {
            const now = new Date();
            const opcoes = { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dataElement.textContent = now.toLocaleDateString('pt-BR', opcoes);
        }
    }

    // ==========================================
    // EVENTOS
    // ==========================================
    configurarEventos() {
        // Adicionar disciplina
        const btnAdd = document.getElementById('btnAddDisc');
        const inputAdd = document.getElementById('discName');

        btnAdd.addEventListener('click', () => {
            this.adicionar(inputAdd.value);
            inputAdd.value = '';
            inputAdd.focus();
        });

        inputAdd.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adicionar(inputAdd.value);
                inputAdd.value = '';
            }
        });

        // Filtros
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filtroAtual = btn.dataset.filtro;
                this.renderizar();
            });
        });

        // Toggle sidebar (mobile)
        const btnMenu = document.getElementById('btnMenu');
        const sidebar = document.getElementById('sidebar');
        
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Toggle sidebar (desktop)
        const btnToggle = document.getElementById('toggleSidebar');
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = btnToggle.querySelector('i');
            icon.classList.toggle('fa-chevron-left');
            icon.classList.toggle('fa-chevron-right');
        });

        // Views
        document.getElementById('viewList').addEventListener('click', () => {
            this.modoView = 'list';
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            document.getElementById('viewList').classList.add('active');
            this.renderizarGrid();
        });

        document.getElementById('viewGrid').addEventListener('click', () => {
            this.modoView = 'grid';
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            document.getElementById('viewGrid').classList.add('active');
            this.renderizarGrid();
        });

        // Ativa view padrão
        document.getElementById('viewGrid').classList.add('active');

        // Limpar tudo
        document.getElementById('btnLimparTudo').addEventListener('click', () => {
            this.limparTudo();
        });

        // Modal
        document.getElementById('modalClose').addEventListener('click', () => {
            this.fecharModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.fecharModal();
        });

        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.fecharModal();
        });

        document.getElementById('modalSave').addEventListener('click', () => {
            this.salvarEdicao();
        });

        document.getElementById('editDiscName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.salvarEdicao();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape fecha modal
            if (e.key === 'Escape') {
                this.fecharModal();
            }
            // Ctrl+Shift+N adiciona disciplina
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                document.getElementById('discName').focus();
            }
        });

        // Atualiza data a cada minuto
        setInterval(() => this.atualizarDataHora(), 60000);
    }
}

// ==========================================
// INSTÂNCIA GLOBAL
// ==========================================
const app = new App();

// Exporta para uso global
window.app = app;

console.log('🚀 APROVAÇÃO 360 carregado com sucesso!');
console.log('📊 Disciplinas:', app.disciplinas.length);
console.log('⌨️  Shortcuts: Ctrl+Shift+N para adicionar');
