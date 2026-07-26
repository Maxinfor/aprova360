/* ==========================================================
   APROVAÇÃO 360 - SISTEMA DE GESTÃO DE ESTUDOS
   Versão 2.0 - Completamente refatorado
   ========================================================== */

class Aprovacao360 {
    constructor() {
        // Estado
        this.disciplinas = [];
        this.filtroAtual = 'all';
        this.modoView = 'grid';
        this.editandoId = null;
        this.notificacoes = [];
        
        // DOM Cache
        this.dom = {};
        
        this.init();
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    init() {
        this.cacheDOM();
        this.carregarDados();
        this.configurarEventos();
        this.renderizar();
        this.atualizarDataHora();
        this.atualizarNotificacoes();
        
        console.log('🚀 APROVAÇÃO 360 carregado!');
        console.log(`📊 ${this.disciplinas.length} disciplinas carregadas`);
        
        // Atualiza data a cada minuto
        setInterval(() => this.atualizarDataHora(), 60000);
    }

    cacheDOM() {
        this.dom = {
            // Sidebar
            sidebar: document.getElementById('sidebar'),
            btnToggleSidebar: document.getElementById('toggleSidebar'),
            btnMenu: document.getElementById('btnMenu'),
            listaDisciplinas: document.getElementById('listaDisciplinas'),
            
            // Inputs
            discName: document.getElementById('discName'),
            btnAdd: document.getElementById('btnAddDisc'),
            
            // Filtros
            filtros: document.querySelectorAll('.filtro-btn'),
            
            // Stats
            totalDisciplinas: document.getElementById('totalDisciplinas'),
            progressoGeral: document.getElementById('progressoGeral'),
            totalConcluidas: document.getElementById('totalConcluidas'),
            statTotal: document.getElementById('statTotal'),
            statConcluidas: document.getElementById('statConcluidas'),
            statPendentes: document.getElementById('statPendentes'),
            statProgresso: document.getElementById('statProgresso'),
            
            // Progresso
            progressoBar: document.getElementById('progressoBar'),
            progressoTexto: document.getElementById('progressoTexto'),
            
            // Grid
            disciplinasGrid: document.getElementById('disciplinasGrid'),
            emptyState: document.getElementById('emptyState'),
            viewGrid: document.getElementById('viewGrid'),
            viewList: document.getElementById('viewList'),
            
            // Mensagens
            mensagemContainer: document.getElementById('mensagemContainer'),
            
            // Modal
            modalEditar: document.getElementById('modalEditar'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            modalCancel: document.getElementById('modalCancel'),
            modalSave: document.getElementById('modalSave'),
            editDiscName: document.getElementById('editDiscName'),
            
            // Notificações
            btnNotification: document.getElementById('btnNotification'),
            notifBadge: document.getElementById('notifBadge'),
            notificacoesDropdown: document.getElementById('notificacoesDropdown'),
            notificacoesList: document.getElementById('notificacoesList'),
            notifClear: document.getElementById('notifClear'),
            
            // Outros
            btnLimparTudo: document.getElementById('btnLimparTudo'),
            currentDate: document.getElementById('currentDate'),
        };
    }

    // ==========================================
    // GERENCIAMENTO DE DADOS
    // ==========================================
    carregarDados() {
        try {
            const dados = localStorage.getItem('aprovacao360_data');
            if (dados) {
                const parsed = JSON.parse(dados);
                this.disciplinas = parsed.disciplinas || [];
                this.notificacoes = parsed.notificacoes || [];
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.disciplinas = [];
            this.notificacoes = [];
        }
    }

    salvarDados() {
        try {
            const dados = {
                disciplinas: this.disciplinas,
                notificacoes: this.notificacoes.slice(0, 50) // Limita notificações
            };
            localStorage.setItem('aprovacao360_data', JSON.stringify(dados));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.mostrarMensagem('Erro ao salvar dados!', 'error');
        }
    }

    // ==========================================
    // CRUD - Disciplinas
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

        // Verifica duplicata (case insensitive)
        if (this.disciplinas.some(d => d.nome.toLowerCase() === nome.toLowerCase())) {
            this.mostrarMensagem(`"${nome}" já existe!`, 'error');
            return false;
        }

        const disciplina = {
            id: Date.now(),
            nome: nome,
            concluido: false,
            dataCriacao: new Date().toISOString(),
            dataConclusao: null
        };

        this.disciplinas.unshift(disciplina); // Adiciona no topo
        this.salvarDados();
        this.renderizar();
        this.mostrarMensagem(`"${nome}" adicionada com sucesso! 🎉`, 'success');
        this.adicionarNotificacao(`Nova disciplina: "${nome}"`, 'info');
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

        if (disc.concluido) {
            this.mostrarMensagem(`"${disc.nome}" concluída! 🎯`, 'success');
            this.adicionarNotificacao(`"${disc.nome}" foi concluída!`, 'success');
            this.confettiEfeito();
        } else {
            this.mostrarMensagem(`"${disc.nome}" reaberta`, 'info');
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
            this.mostrarMensagem(`"${novoNome}" já existe!`, 'error');
            return false;
        }

        const nomeAntigo = disc.nome;
        disc.nome = novoNome;
        this.salvarDados();
        this.renderizar();
        this.mostrarMensagem(`"${nomeAntigo}" → "${novoNome}"`, 'info');
        return true;
    }

    remover(id) {
        const disc = this.disciplinas.find(d => d.id === id);
        if (!disc) return;

        if (confirm(`Tem certeza que deseja remover "${disc.nome}"?`)) {
            this.disciplinas = this.disciplinas.filter(d => d.id !== id);
            this.salvarDados();
            this.renderizar();
            this.mostrarMensagem(`"${disc.nome}" removida`, 'info');
        }
    }

    limparTudo() {
        if (this.disciplinas.length === 0) {
            this.mostrarMensagem('Não há disciplinas para limpar!', 'info');
            return;
        }

        if (confirm('⚠️ Tem certeza que deseja remover TODAS as disciplinas?\nEsta ação não pode ser desfeita!')) {
            this.disciplinas = [];
            this.notificacoes = [];
            this.salvarDados();
            this.renderizar();
            this.mostrarMensagem('Todas as disciplinas foram removidas!', 'info');
        }
    }

    // ==========================================
    // NOTIFICAÇÕES
    // ==========================================
    adicionarNotificacao(texto, tipo = 'info') {
        const notif = {
            id: Date.now(),
            texto,
            tipo,
            data: new Date().toISOString(),
            lida: false
        };
        this.notificacoes.unshift(notif);
        
        // Mantém apenas 50 notificações
        if (this.notificacoes.length > 50) {
            this.notificacoes = this.notificacoes.slice(0, 50);
        }
        
        this.salvarDados();
        this.atualizarNotificacoes();
    }

    atualizarNotificacoes() {
        const naoLidas = this.notificacoes.filter(n => !n.lida).length;
        const badge = this.dom.notifBadge;
        
        if (naoLidas > 0) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // Renderiza lista
        const list = this.dom.notificacoesList;
        if (this.notificacoes.length === 0) {
            list.innerHTML = `
                <div class="notif-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>Tudo tranquilo! Nenhuma notificação.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notificacoes.slice(0, 20).map(n => `
            <div class="notif-item ${n.tipo === 'success' ? 'concluido' : ''}">
                ${n.texto}
                <small style="display:block;font-size:10px;color:var(--text-muted);margin-top:4px;">
                    ${new Date(n.data).toLocaleString('pt-BR')}
                </small>
            </div>
        `).join('');
    }

    limparNotificacoes() {
        this.notificacoes = [];
        this.salvarDados();
        this.atualizarNotificacoes();
        this.dom.notificacoesDropdown.classList.remove('show');
    }

    toggleNotificacoes() {
        const dropdown = this.dom.notificacoesDropdown;
        dropdown.classList.toggle('show');
        
        // Marca todas como lidas ao abrir
        if (dropdown.classList.contains('show')) {
            this.notificacoes.forEach(n => n.lida = true);
            this.salvarDados();
            this.atualizarNotificacoes();
        }
    }

    // ==========================================
    // FILTROS E VIEWS
    // ==========================================
    getDisciplinasFiltradas() {
        let filtradas = [...this.disciplinas];
        
        switch (this.filtroAtual) {
            case 'pending':
                filtradas = filtradas.filter(d => !d.concluido);
                break;
            case 'completed':
                filtradas = filtradas.filter(d => d.concluido);
                break;
            default:
                break;
        }
        
        return filtradas;
    }

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================
    renderizar() {
        this.renderizarLista();
        this.renderizarGrid();
        this.renderizarEstatisticas();
        this.atualizarProgresso();
        this.atualizarVazia();
        this.renderizarBadges();
    }

    renderizarLista() {
        const container = this.dom.listaDisciplinas;
        const filtradas = this.getDisciplinasFiltradas();

        if (filtradas.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mini">
                    <i class="fas fa-${this.filtroAtual === 'all' ? 'inbox' : 
                        this.filtroAtual === 'pending' ? 'clock' : 'check-circle'}"></i>
                    <p>${this.filtroAtual === 'all' ? 'Nenhuma disciplina cadastrada' : 
                        this.filtroAtual === 'pending' ? 'Nenhuma disciplina pendente 🎉' : 
                        'Nenhuma disciplina concluída'}</p>
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
        const container = this.dom.disciplinasGrid;
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
                        ${d.concluido ? '✅' : '⏳'}
                    </span>
                </div>
                <div class="grid-item-actions">
                    <button class="btn-action" onclick="app.toggleConcluido(${d.id})" title="Alternar status">
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

    renderizarEstatisticas() {
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

    renderizarBadges() {
        this.dom.totalDisciplinas.textContent = this.disciplinas.length;
    }

    // ==========================================
    // MODAL
    // ==========================================
    abrirModalEditar(id) {
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

    // ==========================================
    // MENSAGENS
    // ==========================================
    mostrarMensagem(texto, tipo = 'info') {
        const container = this.dom.mensagemContainer;
        if (!container) return;

        const icones = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const mensagem = document.createElement('div');
        mensagem.className = `mensagem ${tipo}`;
        mensagem.innerHTML = `
            <i class="fas ${icones[tipo] || icones.info}"></i>
            <span>${texto}</span>
            <button class="mensagem-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(mensagem);

        setTimeout(() => {
            if (mensagem.parentElement) {
                mensagem.style.opacity = '0';
                mensagem.style.transform = 'translateY(-10px)';
                setTimeout(() => mensagem.remove(), 300);
            }
        }, 4000);
    }

    // ==========================================
    // CONFETTI (Celebração)
    // ==========================================
    confettiEfeito() {
        // Usa canvas-confetti se disponível, senão cria um efeito simples
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 }
            });
        } else {
            // Efeito simples com emojis
            this._confettiEmoji();
        }
    }

    _confettiEmoji() {
        const emojis = ['🎉', '✨', '⭐', '🎊', '🌟', '💫'];
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.cssText = `
                    position: fixed;
                    font-size: ${20 + Math.random() * 20}px;
                    left: ${10 + Math.random() * 80}%;
                    top: -20px;
                    pointer-events: none;
                    z-index: 9999;
                    animation: confettiFall ${1 + Math.random() * 1.5}s ease-in forwards;
                `;
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 3000);
            }, i * 80);
        }
        
        // Adiciona keyframe se não existir
        if (!document.getElementById('confettiStyle')) {
            const style = document.createElement('style');
            style.id = 'confettiStyle';
            style.textContent = `
                @keyframes confettiFall {
                    0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
                    100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.5); }
                }
            `;
            document.head.appendChild(style);
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
        const now = new Date();
        const opcoes = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        this.dom.currentDate.textContent = now.toLocaleDateString('pt-BR', opcoes);
    }

    // ==========================================
    // EVENTOS
    // ==========================================
    configurarEventos() {
        // ===== Adicionar =====
        this.dom.btnAdd.addEventListener('click', () => {
            this.adicionar(this.dom.discName.value);
            this.dom.discName.value = '';
            this.dom.discName.focus();
        });

        this.dom.discName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.adicionar(this.dom.discName.value);
                this.dom.discName.value = '';
            }
        });

        // ===== Filtros =====
        this.dom.filtros.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.filtros.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filtroAtual = btn.dataset.filtro;
                this.renderizar();
            });
        });

        // ===== Views =====
        this.dom.viewGrid.addEventListener('click', () => {
            this.modoView = 'grid';
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            this.dom.viewGrid.classList.add('active');
            this.renderizarGrid();
        });

        this.dom.viewList.addEventListener('click', () => {
            this.modoView = 'list';
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            this.dom.viewList.classList.add('active');
            this.renderizarGrid();
        });

        // ===== Sidebar =====
        this.dom.btnMenu.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('open');
        });

        this.dom.btnToggleSidebar.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('collapsed');
            const icon = this.dom.btnToggleSidebar.querySelector('i');
            icon.classList.toggle('fa-chevron-left');
            icon.classList.toggle('fa-chevron-right');
        });

        // Fecha sidebar ao clicar fora (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = this.dom.sidebar;
                const menuBtn = this.dom.btnMenu;
                if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // ===== Notificações =====
        this.dom.btnNotification.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificacoes();
        });

        this.dom.notifClear.addEventListener('click', () => {
            this.limparNotificacoes();
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.dom.btnNotification.contains(e.target) && 
                !this.dom.notificacoesDropdown.contains(e.target)) {
                this.dom.notificacoesDropdown.classList.remove('show');
            }
        });

        // ===== Modal =====
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

        // ===== Limpar Tudo =====
        this.dom.btnLimparTudo.addEventListener('click', () => {
            this.limparTudo();
        });

        // ===== Shortcuts =====
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+N = Nova disciplina
            if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
                e.preventDefault();
                this.dom.discName.focus();
                this.dom.discName.select();
            }
            
            // Ctrl+F = Focar filtros
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const primeiroFiltro = document.querySelector('.filtro-btn');
                if (primeiroFiltro) primeiroFiltro.focus();
            }
        });

        // Auto-foco no input ao carregar
        setTimeout(() => {
            this.dom.discName.focus();
        }, 500);
    }
}

// ==========================================
// INSTÂNCIA GLOBAL
// ==========================================
const app = new Aprovacao360();

// Torna global para chamadas inline
window.app = app;

// Carrega confetti se disponível
if (typeof confetti === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    script.onload = () => console.log('🎊 Confetti carregado!');
    document.head.appendChild(script);
}
