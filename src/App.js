import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Folder, Plus, Trash2, Settings, HelpCircle, Star, BrainCircuit, Bot, BarChart, Users, Milestone, Clapperboard, Lightbulb, Drama, MessageSquare, ChevronDown, Search, X, FolderKanban, FileUp, FileDown, LoaderCircle, Eye, EyeOff, Pencil, LogOut, Upload, MoreVertical, FilePlus2, Trash, Undo, Wand2, RefreshCw, CheckSquare, Square, Save, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { BarChart as RechartsBarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- Configuração da API (Agora no lugar correto) ---
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// --- Função Helper para a API ---
const callGeminiApi = async (prompt) => {
  try {
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
          "temperature": 0.7,
          "topP": 1,
          "topK": 1,
      }
    };
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Body:", errorBody);
      throw new Error(`A solicitação à API falhou com o status ${response.status}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
      let text = result.candidates[0].content.parts[0].text;
      // Limpeza da resposta para remover marcadores indesejados
      text = text.replace(/```screenplay/gi, '')
                 .replace(/```/g, '')
                 .replace(/\*/g, '')
                 .trim();
      return text;
    } else {
      console.warn("Resposta da API recebida, mas sem conteúdo válido:", result);
      return "Não foi possível gerar uma resposta. A resposta da API estava vazia ou em formato inesperado. Tente novamente.";
    }
  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    return `Erro ao conectar com a IA: ${error.message}. Verifique sua chave de API e a conexão com a internet.`;
  }
};


// --- Componente Principal da Aplicação ---
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('projects');
  const [projects, setProjects] = useState([
    { id: 1, name: 'A Última Noite', files: [{ id: 1, name: 'Roteiro_v3', type: 'script', content: `CENA INT. APARTAMENTO DE KAITO - NOITE\n\nCHUVA forte bate na janela. O apartamento está escuro, iluminado apenas por um abajur. Garrafas vazias na mesa.\n\nKAITO (50s), barba por fazer, olha para uma foto antiga na parede. Uma mulher e uma garota sorriem.\n\nO telefone toca. Kaito ignora. Toca de novo.\n\nKAITO\n(para si mesmo)\nDeixe tocar.\n\nEle desliga o telefone. O silêncio é pesado. Kaito abre uma gaveta, tira um revólver. Encara o objeto.`, argument: 'Argumento_A_Ultima_Noite' }, { id: 2, name: 'Argumento_A_Ultima_Noite', type: 'argument', content: { mainTheme: 'Vingança', selectedSubThemes: [], characters: { protagonist: { summary: 'Detetive atormentado' }, antagonist: { summary: 'Assassino esquivo'} }, narrativeElements: {}, consolidatedArgument: {} } }] },
    { id: 2, name: 'Cidade das Sombras', files: [{ id: 3, name: 'Roteiro_v1', type: 'script', content: `CENA EXT. BECO ESCURO - MADRUGADA\n\nNEBLINA densa envolve o beco. Apenas uma luz de poste pisca intermitentemente.\n\nUMA FIGURA encapuzada observa das sombras.`, argument: 'Argumento_Cidade_Sombras' }] },
  ]);
  const [trash, setTrash] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectType, setNewProjectType] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [conversations, setConversations] = useState([]);

  // Se o usuário não estiver logado, mostra a nova Landing Page
  if (!isLoggedIn) {
      return <LandingPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // O restante do app permanece o mesmo para usuários logados
  const handleCreateNew = (type, project = null) => {
    setNewProjectType(type);
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  
  const handleAddProject = (projectName) => {
      const newProject = {
          id: Date.now(),
          name: projectName || `Novo Projeto ${projects.length + trash.filter(i => i.itemType === 'project').length + 1}`,
          files: []
      };
      setProjects([...projects, newProject]);
      setIsModalOpen(false);
  };

  const handleFileSelect = (file, page) => {
    setActiveFile(file);
    setCurrentPage(page);
  };
  
  const updateActiveFile = (updatedFile) => {
    if (!updatedFile) return;
    setActiveFile(updatedFile);
    setProjects(prevProjects => prevProjects.map(p => ({
        ...p,
        files: p.files.map(f => f.id === updatedFile.id ? updatedFile : f)
    })));
  };

  const handleDeleteProject = (projectId) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if(projectToDelete) {
        setTrash([...trash, {...projectToDelete, itemType: 'project', deletedAt: new Date()}]);
        setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleDeleteFile = (projectId, fileId) => {
    const project = projects.find(p => p.id === projectId);
    const fileToDelete = project?.files.find(f => f.id === fileId);
    if(fileToDelete) {
        setTrash([...trash, {...fileToDelete, itemType: 'file', projectId, deletedAt: new Date()}]);
        setProjects(projects.map(p => 
            p.id === projectId ? {...p, files: p.files.filter(f => f.id !== fileId)} : p
        ));
        if (activeFile && activeFile.id === fileId) {
            setActiveFile(null);
        }
    }
  };
  
  const handleRestoreItem = (item) => {
      if (item.itemType === 'project') {
          setProjects([...projects, item]);
      } else if (item.itemType === 'file') {
          setProjects(projects.map(p => {
              if (p.id === item.projectId) {
                  return {...p, files: [...p.files, item]};
              }
              return p;
          }));
      }
      setTrash(trash.filter(t => t.id !== item.id));
  };
  
  const handlePermanentDelete = (itemId) => {
      setTrash(trash.filter(t => t.id !== itemId));
  };

  const addFileToProject = (project, fileType, fileData) => {
    let content;
    if (fileType === 'script') {
        content = `CENA INT. NOVO CENÁRIO - DIA\n\n`;
    } else if (fileType === 'argument') {
        content = {
            mainTheme: '', selectedSubThemes: [],
            characters: {
                protagonist: { psicologico: '', forcas: '', fraquezas: '', motivacaoInterna: '', motivacaoExterna: '', motivacaoSocial: '', summary: '' },
                antagonist: { psicologico: '', forcas: '', fraquezas: '', motivacaoInterna: '', motivacaoExterna: '', motivacaoSocial: '', summary: '' }
            },
            narrativeElements: {
                storyline: '', conceitoFundamental: '', temas: '', objetivoTrama: '', objetivoPersonagem: '', plotTwist: '', recursoNarrativo: '', objetosChave: '', lugaresImportantes: '', sentimentosPredominantes: '', summary: ''
            },
            consolidatedArgument: { storyline: '', sinopse: '', argumentoCompleto: '' },
        };
    }

    const newFile = {
        id: Date.now(),
        name: fileData.fileName || `Novo ${fileType === 'script' ? 'Roteiro' : 'Argumento'}`,
        type: fileType,
        version: fileData.version,
        language: fileData.language,
        format: fileData.format,
        duration: fileData.duration,
        mainGenre: fileData.mainGenre,
        secondaryGenre: fileData.secondaryGenre,
        targetAudience: fileData.targetAudience,
        exhibitionWindow: fileData.exhibitionWindow,
        content: content,
        ...(fileType === 'script' && { argument: fileData.argumentLink }),
    };

    setProjects(projects.map(p => p.id === project.id ? {...p, files: [...p.files, newFile]} : p));
    setIsModalOpen(false);
    return newFile;
  };

  const ModalComponent = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fileData = Object.fromEntries(formData.entries());
        const newFile = addFileToProject(selectedProject, newProjectType, fileData);

        if (newProjectType === 'argument' && newFile) {
            handleFileSelect(newFile, 'argument-generator');
        }
    };
      
    const MetadataFields = () => (
        <div className="grid grid-cols-2 gap-4 my-4">
            <input name="version" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Versão" />
            <input name="language" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Língua" />
            <input name="format" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Formato (ex: Longa-metragem)" />
            <input name="duration" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Duração (ex: 90 min)" />
            <input name="mainGenre" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Gênero Principal" />
            <input name="secondaryGenre" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Gênero Secundário" />
            <input name="targetAudience" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Público-alvo" />
            <input name="exhibitionWindow" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Janela de Exibição" />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in-fast">
          <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                  {newProjectType === 'project' && 'Criar Novo Projeto'}
                  {newProjectType === 'script' && `Adicionar Roteiro a "${selectedProject?.name}"`}
                  {newProjectType === 'argument' && `Adicionar Argumento a "${selectedProject?.name}"`}
                  {newProjectType === 'upload' && `Fazer Upload para "${selectedProject?.name}"`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-indigo-400 transition-colors"><X size={24} /></button>
            </div>
            
            {newProjectType === 'project' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleAddProject(e.target.projectName.value); }}>
                <input name="projectName" className="w-full bg-gray-700 p-2 rounded mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Nome do Projeto" required />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded transition-all transform hover:scale-105 active:scale-100">Criar Projeto</button>
              </form>
            ) : newProjectType === 'upload' ? (
                <form onSubmit={(e) => { e.preventDefault(); alert('Funcionalidade de upload simulada!'); setIsModalOpen(false); }}>
                    <p className="mb-4 text-sm text-gray-300">Faça o upload de um arquivo de roteiro ou argumento no formato .txt.</p>
                    <div className="relative border-2 border-dashed border-gray-500 rounded-lg p-10 text-center mb-4 hover:border-indigo-400 transition-colors">
                        <Upload size={48} className="mx-auto text-gray-400"/>
                        <p className="mt-2 text-sm text-gray-400">Arraste e solte um arquivo aqui ou clique para selecionar.</p>
                        <input type="file" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" accept=".txt"/>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded transition-all transform hover:scale-105 active:scale-100">Enviar Arquivo</button>
                </form>
            ) : (
                 <form onSubmit={handleSubmit}>
                    <input name="fileName" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder={newProjectType === 'script' ? 'Nome do Roteiro' : 'Nome do Argumento'} required />
                    <MetadataFields/>
                    {newProjectType === 'script' && (
                        <select name="argumentLink" className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4">
                            <option value="">Vincular a um argumento (opcional)</option>
                            {selectedProject?.files.filter(f => f.type === 'argument').map(arg => (
                              <option key={arg.id} value={arg.name}>{arg.name}</option>
                            ))}
                        </select>
                    )}
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded transition-all transform hover:scale-105 active:scale-100">
                        {newProjectType === 'argument' ? 'Criar e Editar Argumento' : 'Criar Roteiro'}
                    </button>
                 </form>
            )}
          </div>
        </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectDashboard projects={projects} trash={trash} handleCreateNew={handleCreateNew} handleFileSelect={handleFileSelect} handleDeleteProject={handleDeleteProject} handleDeleteFile={handleDeleteFile} handleRestoreItem={handleRestoreItem} handlePermanentDelete={handlePermanentDelete}/>;
      case 'analysis':
        return <AnalysisDashboard setCurrentPage={setCurrentPage} script={activeFile} />;
      case 'editor':
        return <ScriptEditor setCurrentPage={setCurrentPage} script={activeFile} projects={projects} setScriptContent={(content) => updateActiveFile({ ...activeFile, content })}/>;
      case 'argument-generator':
        return <ArgumentGenerator setCurrentPage={setCurrentPage} argumentFile={activeFile} setArgumentFile={updateActiveFile} />;
      case 'pitching-generator':
        return <PitchingGenerator setCurrentPage={setCurrentPage} script={activeFile} />;
      case 'chat':
        return <ChatPage scriptContext={activeFile} conversations={conversations} setConversations={setConversations} />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      case 'help':
        return <HelpPage setCurrentPage={setCurrentPage} />;
      default:
        return <ProjectDashboard projects={projects} trash={trash} handleCreateNew={handleCreateNew} handleFileSelect={handleFileSelect} handleDeleteProject={handleDeleteProject} handleDeleteFile={handleDeleteFile} handleRestoreItem={handleRestoreItem} handlePermanentDelete={handlePermanentDelete}/>;
    }
  };
  
    return (
    <>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        .animate-fade-in-fast { animation: fadeIn 0.2s ease-in-out; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pulse-slow { animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
      <div className="bg-gray-900 text-white font-sans flex min-h-screen">
        <Sidebar setCurrentPage={setCurrentPage} currentPage={currentPage} onLogout={() => setIsLoggedIn(false)} />
        <div className="flex-1 flex flex-col ml-16 md:ml-64 transition-all duration-300">
            <main className="flex-grow p-4 sm:p-6 md:p-8">
              {renderPage()}
            </main>
            <footer className="text-center p-4 text-xs text-gray-500">
              Conteúdo gerado por IA. Revise com atenção.
            </footer>
        </div>
        {isModalOpen && <ModalComponent />}
      </div>
    </>
  );
};

const LegalModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] animate-fade-in-fast">
        <div className="bg-gray-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col animate-scale-in">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h2 className="text-2xl font-bold">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 text-gray-300 space-y-4">
                {content.split('\n\n').map((paragraph, index) => (
                    <div key={index}>
                        {paragraph.startsWith('CLÁUSULA') || paragraph.match(/^\d+\./) ? (
                            <h3 className="text-lg font-bold text-indigo-300 mt-4 mb-2">{paragraph.split('\n')[0]}</h3>
                        ) : null}
                         {paragraph.split('\n').map((line, lineIndex) => (
                             <p key={lineIndex} className="mb-2">{line.match(/^(CLÁUSULA|\d+\.)/) && lineIndex === 0 ? line.substring(line.indexOf(' ')+1) : line}</p>
                         ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// --- MODAL DE LOGIN ---
const LoginModal = ({ onClose, onLogin, onSwitchToSignUp }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in-fast">
            <div className="bg-gray-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Entrar na sua Conta</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                 <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div>
                        <label className="text-sm font-bold text-gray-300 block mb-2">Email</label>
                        <input type="email" required className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="seu@email.com" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-300 block mb-2">Senha</label>
                        <input type="password" required className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="********" />
                    </div>
                    <div className="flex items-center justify-between">
                        <a href="#" className="text-sm text-indigo-400 hover:underline">Esqueceu a senha?</a>
                    </div>
                    <div>
                        <button type="submit" className="w-full p-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-100">
                            Entrar
                        </button>
                    </div>
                </form>
                <p className="text-center text-sm text-gray-400 mt-6">
                    Não tem uma conta? <button type="button" onClick={onSwitchToSignUp} className="font-medium text-indigo-400 hover:underline bg-transparent border-none cursor-pointer">Cadastre-se</button>
                </p>
            </div>
        </div>
    );
};

// --- MODAL DE CADASTRO ---
const SignUpModal = ({ onClose, onLogin, onOpenTerms, onOpenPrivacy, onSwitchToLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const handleSignUp = (e) => {
        e.preventDefault();
        if (!termsAccepted || !privacyAccepted) {
            alert('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.');
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        alert('Conta criada com sucesso! Você será redirecionado para a tela principal.');
        onLogin();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in-fast">
            <div className="bg-gray-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Criar Conta</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                     <div>
                        <label className="text-sm font-bold text-gray-300 block mb-2">Nome</label>
                        <input type="text" name="name" required className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Seu nome completo" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-300 block mb-2">Email</label>
                        <input type="email" name="email" required className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="seu@email.com" />
                    </div>
                    <div className="relative">
                        <label className="text-sm font-bold text-gray-300 block mb-2">Senha</label>
                        <input type={showPassword ? 'text' : 'password'} name="password" required className="w-full p-3 pr-10 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="********" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bottom-3 right-3 text-gray-400 hover:text-white">
                           {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <div className="relative">
                        <label className="text-sm font-bold text-gray-300 block mb-2">Confirmar Senha</label>
                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required className="w-full p-3 pr-10 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="********" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute bottom-3 right-3 text-gray-400 hover:text-white">
                           {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center text-sm text-gray-400">
                            <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="h-4 w-4 bg-gray-700 border-gray-600 rounded mr-2" />
                            Eu li e concordo com os <button type="button" onClick={onOpenTerms} className="text-indigo-400 hover:underline mx-1 bg-transparent border-none p-0">Termos de Uso</button>.
                        </label>
                        <label className="flex items-center text-sm text-gray-400">
                            <input type="checkbox" checked={privacyAccepted} onChange={() => setPrivacyAccepted(!privacyAccepted)} className="h-4 w-4 bg-gray-700 border-gray-600 rounded mr-2" />
                            Eu li e concordo com a <button type="button" onClick={onOpenPrivacy} className="text-indigo-400 hover:underline mx-1 bg-transparent border-none p-0">Política de Privacidade</button>.
                        </label>
                    </div>
                    
                    <div>
                        <button type="submit" disabled={!termsAccepted || !privacyAccepted} className="w-full mt-4 p-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-100 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            Criar Conta
                        </button>
                    </div>
                </form>
                <p className="text-center text-sm text-gray-400 mt-6">
                    Já tem uma conta? <button type="button" onClick={onSwitchToLogin} className="font-medium text-indigo-400 hover:underline bg-transparent border-none cursor-pointer">Faça login</button>
                </p>
            </div>
        </div>
    );
};


// --- LANDING PAGE ---
const LandingPage = ({ onLogin }) => {
    const [authAction, setAuthAction] = useState(null); // 'login', 'signup'
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    
    // O link direto da imagem do Imgur
    const logoUrl = "https://i.imgur.com/Ls0PPoo.png";

    const termsContent = `Este Termo de Aceite e Uso de Software ("Termo") estabelece os termos e condições para a utilização do aplicativo "Lean Film Design" ("Software"), desenvolvido e disponibilizado pela CINEMARKETING CONTEÚDO E ENTRETENIMENTO LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 05.350.563/0001-23, com sede em Itaúna, Minas Gerais, doravante denominada "LICENCIANTE", pelo usuário, doravante denominado "USUÁRIO".

Ao clicar em "Aceito" ou ao utilizar o Software, o USUÁRIO declara ter lido, compreendido e concordado integralmente com as disposições deste Termo.

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente Termo tem por objeto regular a licença de uso, não exclusiva e intransferível, do Software pelo USUÁRIO. O Software "Lean Film Design" utiliza a metodologia Lean Film Design, descrita no livro "Manual Prático de Criação para Diretores, Roteiristas e Produtores Modernos", para analisar roteiros e gerar insights baseados em Inteligência Artificial (IA), auxiliando o USUÁRIO no desenvolvimento de projetos audiovisuais. As funcionalidades incluem, mas não se limitam a: análise estrutural de roteiros, desenvolvimento e análise de perfis de personagens, sugestão de elementos narrativos e temáticos, otimização de diálogos e avaliação da viabilidade de projetos audiovisuais com base nos princípios da metodologia Lean Film Design.

CLÁUSULA SEGUNDA – DA LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)
2.1. A LICENCIANTE compromete-se a tratar os dados pessoais dos USUÁRIOS em estrita conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD) e demais legislações aplicáveis.

2.2. Os dados coletados serão utilizados exclusivamente para as finalidades necessárias à prestação dos serviços oferecidos pelo Software, como cadastro do USUÁRIO, personalização da experiência no aplicativo, processamento e análise dos roteiros e informações inseridas pelo USUÁRIO para fornecer os insights e funcionalidades da metodologia Lean Film Design, e comunicação sobre atualizações ou informações relevantes do Software.

2.3. O USUÁRIO, ao aceitar este Termo, consente com a coleta e tratamento de seus dados pessoais para as finalidades aqui descritas.

2.4. A LICENCIANTE empregará medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.

2.5. Para mais informações sobre o tratamento de dados pessoais, o USUÁRIO deverá consultar a Política de Privacidade do Software, disponibilizada juntamente com este Termo e no website oficial da LICENCIANTE.

CLÁUSULA TERCEIRA – DOS DIREITOS AUTORAIS E SIGILO
3.1. Todo o conteúdo inserido pelo USUÁRIO no Software, incluindo, mas não se limitando a, roteiros, ideias, projetos, textos e quaisquer outros materiais criativos ("Conteúdo do Usuário"), é de sua exclusiva titularidade e responsabilidade.

3.2. A LICENCIANTE compromete-se a manter o mais absoluto sigilo sobre todo o Conteúdo do Usuário, utilizando-o estritamente para a funcionalidade do Software e para fornecer os serviços relacionados à metodologia Lean Film Design, conforme solicitado e iniciado pelo USUÁRIO.

3.3. A LICENCIANTE garante que o Conteúdo do Usuário não será divulgado, compartilhado, copiado, modificado ou utilizado para quaisquer outras finalidades que não as expressamente permitidas neste Termo ou consentidas pelo USUÁRIO.

3.4. Os direitos autorais inerentes ao Conteúdo do Usuário são integralmente preservados, não havendo qualquer cessão ou licença de direitos autorais à LICENCIANTE pela simples utilização do Software.

CLÁUSULA QUARTA – DA NÃO UTILIZAÇÃO DE DADOS PARA ALIMENTAR MODELOS DE INTELIGÊNCIA ARTIFICIAL (IA)
4.1. A LICENCIANTE declara e garante expressamente que nenhum dado pessoal do USUÁRIO e nenhum Conteúdo do Usuário inserido no Software será utilizado para treinar, alimentar, aprimorar ou desenvolver quaisquer modelos de inteligência artificial, algoritmos de aprendizado de máquina ou tecnologias similares, sejam eles proprietários da LICENCIANTE ou de terceiros, para além das funcionalidades explícitas e sob demanda do USUÁRIO dentro do Software.

CLÁUSULA QUINTA – DA NATUREZA DO TERMO E RESCISÃO
5.1. O aceite deste Termo configura um contrato de licença de uso de software entre a LICENCIANTE e o USUÁRIO.

5.2. Este Termo vigorará por prazo indeterminado, a partir da data de seu aceite pelo USUÁRIO.

5.3. Qualquer das partes poderá rescindir o presente Termo a qualquer momento, imotivadamente, mediante simples comunicação à outra parte ou através da descontinuação do uso do Software e solicitação de exclusão de conta, sem que isso gere qualquer ônus, multa ou prejuízo, ressalvadas as obrigações pendentes e o disposto nas cláusulas de sigilo e proteção de dados, que permanecerão em vigor mesmo após a rescisão.

5.4. Em caso de rescisão pelo USUÁRIO, este poderá solicitar a exclusão de seus dados pessoais e Conteúdo do Usuário dos servidores da LICENCIANTE, nos termos da Política de Privacidade.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DO USUÁRIO
6.1. O USUÁRIO se compromete a utilizar o Software de forma lícita, em conformidade com a legislação vigente, a moral e os bons costumes.

6.2. O USUÁRIO é o único responsável pela veracidade, exatidão e legalidade dos dados e do Conteúdo do Usuário inseridos no Software.

6.3. O USUÁRIO se compromete a manter seus dados de acesso (login e senha) em sigilo, não os compartilhando com terceiros.

CLÁUSULA SÉTIMA – DAS OBRIGAÇÕES DA LICENCIANTE
7.1. A LICENCIANTE se compromete a manter o Software em funcionamento regular, envidando seus melhores esforços para corrigir eventuais falhas no menor tempo possível.

7.2. A LICENCIANTE poderá realizar atualizações e modificações no Software visando à melhoria de suas funcionalidades, mediante aviso prévio ao USUÁRIO, quando aplicável.

CLÁUSULA OITAVA – DA PROPRIEDADE INTELECTUAL DO SOFTWARE
8.1. O Software "Lean Film Design", sua estrutura, organização, código-fonte, design, metodologia subjacente, marcas, logotipos e demais elementos de propriedade intelectual são de titularidade exclusiva da LICENCIANTE ou de seus licenciadores, sendo protegidos pelas leis de propriedade intelectual.

8.2. Este Termo não confere ao USUÁRIO qualquer direito de propriedade intelectual sobre o Software, mas tão somente uma licença de uso, nos termos aqui estabelecidos.

CLÁUSULA NONA – DAS DISPOSIÇÕES GERAIS
9.1. Este Termo poderá ser atualizado periodicamente pela LICENCIANTE para refletir alterações no Software ou na legislação aplicável. O USUÁRIO será notificado sobre alterações significativas. A continuidade do uso do Software após tais alterações implicará na aceitação dos novos termos.

9.2. A tolerância de uma parte com relação ao descumprimento de qualquer obrigação prevista neste Termo pela outra parte não implicará novação ou renúncia a qualquer direito.

9.3. Caso qualquer disposição deste Termo seja considerada nula, anulável, inválida ou inoperante, as demais disposições permanecerão em pleno vigor e efeito.

CLÁUSULA DÉCIMA – DO FORO
10.1. Para dirimir quaisquer controvérsias oriundas do presente Termo, as partes elegem o foro da Comarca de Itaúna, Estado de Minas Gerais, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e acordadas, o USUÁRIO manifesta seu aceite eletrônico a este Termo ao prosseguir com o uso do Software.`;
    const privacyContent = `Política de Privacidade
A CINEMARKETING CONTEÚDO E ENTRETENIMENTO LTDA, desenvolvedora do aplicativo "Lean Film Design", está comprometida em proteger a privacidade e os dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) do Brasil.

1. DADOS COLETADOS
Coletamos os seguintes tipos de dados:

a. Dados de Cadastro: Informações fornecidas por Você ao criar sua conta, como nome, e-mail e senha.

b. Conteúdo do Usuário: Roteiros, ideias, projetos e outros textos que Você insere no Aplicativo para análise e utilização das funcionalidades.

c. Dados de Uso: Informações sobre como Você utiliza o Aplicativo, como funcionalidades acessadas, frequência de uso e interações, de forma anonimizada e agregada para melhorias internas do serviço.

2. FINALIDADE DO TRATAMENTO DOS DADOS
Seus dados são tratados para as seguintes finalidades:

a. Permitir o acesso e uso das funcionalidades do Aplicativo "Lean Film Design".

b. Processar e analisar o Conteúdo do Usuário para fornecer os insights e resultados baseados na metodologia Lean Film Design e IA, conforme solicitado por Você.

c. Gerenciar sua conta e fornecer suporte técnico.

d. Comunicar sobre atualizações, novos recursos ou informações importantes sobre o Aplicativo.

e. Melhorar a experiência do Usuário e a qualidade do Aplicativo, através da análise de dados de uso agregados e anonimizados.

f. Cumprir obrigações legais e regulatórias.

Importante: Conforme estabelecido em nosso Termo de Aceite, seu Conteúdo do Usuário e seus dados pessoais não serão utilizados para treinar, alimentar ou aprimorar modelos de Inteligência Artificial externos ou para quaisquer finalidades alheias à prestação dos serviços do Aplicativo "Lean Film Design" sem seu consentimento explícito.

3. COMPARTILHAMENTO DE DADOS
a. Não compartilhamos seus dados pessoais ou Conteúdo do Usuário com terceiros, exceto:

i. Com provedores de serviços estritamente necessários para a operação do Aplicativo (ex: serviços de hospedagem em nuvem), que estarão contratualmente obrigados a manter a confidencialidade e segurança dos dados.

ii. Por obrigação legal ou ordem judicial.

b. Em nenhuma hipótese seus dados pessoais ou Conteúdo do Usuário serão comercializados.

4. SEGURANÇA DOS DADOS
Adotamos medidas técnicas e administrativas para proteger seus dados pessoais e Conteúdo do Usuário contra acessos não autorizados, perda, alteração, destruição ou qualquer forma de tratamento inadequado ou ilícito. No entanto, nenhum sistema é completamente seguro, e envidamos nossos melhores esforços para garantir a proteção de suas informações.

5. DIREITOS DOS TITULARES DOS DADOS
Você, como titular dos dados, possui os seguintes direitos, conforme a LGPD:

a. Confirmação da existência de tratamento.

b. Acesso aos dados.

c. Correção de dados incompletos, inexatos ou desatualizados.

d. Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.

e. Portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa.

f. Eliminação dos dados pessoais tratados com o seu consentimento, exceto nas hipóteses de conservação legalmente previstas.

g. Informação sobre as entidades públicas e privadas com as quais realizamos uso compartilhado de dados.

h. Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.

i. Revogação do consentimento.

Para exercer seus direitos, entre em contato conosco através do e-mail: atendimento@cmkfilmes.com.

6. RETENÇÃO DOS DADOS
Seus dados pessoais e Conteúdo do Usuário serão mantidos apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados, para o cumprimento de obrigações legais ou regulatórias, ou até que Você solicite a exclusão de sua conta e dados, observadas as exceções legais.

7. ATUALIZAÇÕES DESTA POLÍTICA DE PRIVACIDADE
Esta Política de Privacidade poderá ser atualizada periodicamente. Notificaremos Você sobre alterações significativas através do Aplicativo ou por e-mail. Recomendamos que Você revise esta política regularmente.

8. CONTATO
Em caso de dúvidas ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato com:

CINEMARKETING CONTEÚDO E ENTRETENIMENTO LTDA

E-mail: atendimento@cmkfilmes.com`;

    const features = [
      {
        icon: BrainCircuit,
        title: "Desenvolvimento de Argumento Guiado",
        description: "Estruture sua história passo a passo, desde o tema central até a criação de personagens complexos e arcos narrativos envolventes."
      },
      {
        icon: BarChart,
        title: "Análise Narrativa com IA",
        description: "Receba insights profundos sobre a estrutura, ritmo, personagens e potencial de mercado do seu roteiro, identificando pontos fortes e áreas para aprimoramento."
      },
      {
        icon: Pencil,
        title: "Editor de Roteiro Inteligente",
        description: "Escreva no formato profissional Master Scenes com ferramentas que automatizam a formatação e uma IA que sugere melhorias e gera cenas completas."
      },
      {
        icon: Bot,
        title: "Consultor de IA 24/7",
        description: "Converse com seu assistente de roteiro a qualquer momento para debater ideias, resolver bloqueios criativos e explorar novas direções para sua história."
      }
    ];

     const testimonials = [
        {
            quote: "O Lean Film Design transformou meu processo de escrita. A análise de IA é como ter um consultor de roteiro experiente disponível a qualquer hora. Indispensável!",
            name: "Sofia Almeida",
            role: "Roteirista Premiada"
        },
        {
            quote: "Finalmente uma ferramenta que entende a jornada completa do cineasta. Do argumento ao pitching, a plataforma organiza e potencializa minhas ideias de forma brilhante.",
            name: "Lucas Martins",
            role: "Diretor e Produtor"
        },
        {
            quote: "A capacidade de desenvolver personagens e testar estruturas narrativas antes de escrever a primeira cena economiza meses de trabalho. Uma verdadeira revolução.",
            name: "Isabela Costa",
            role: "Roteirista de TV"
        }
    ];
    
     const faqs = [
        {
            question: "Meus roteiros e ideias estão seguros na plataforma?",
            answer: "Sim. A segurança e o sigilo dos seus projetos são nossa maior prioridade. Utilizamos criptografia de ponta e, conforme nossos Termos de Uso, garantimos que seu conteúdo é 100% seu e jamais será compartilhado ou usado para treinar modelos de IA."
        },
        {
            question: "Posso cancelar minha assinatura a qualquer momento?",
            answer: "Sim, você pode cancelar sua assinatura Pro a qualquer momento, sem taxas ou burocracia. Você continuará com acesso a todas as funcionalidades até o final do período de faturamento já pago."
        },
        {
            question: "O que acontece depois dos 7 dias do teste gratuito?",
            answer: "Ao final do período de 7 dias, você será convidado a escolher o plano Pro para continuar utilizando todas as funcionalidades. Se optar por não assinar, seus projetos ficarão salvos, mas o acesso às ferramentas será limitado até que uma assinatura seja ativada."
        },
        {
            question: "Quais são as formas de pagamento aceitas?",
            answer: "Aceitamos os principais cartões de crédito (Visa, MasterCard, American Express) e outras formas de pagamento digital. Todo o processamento é feito de forma segura através de nosso parceiro de pagamentos."
        }
    ];

    return (
        <>
            <style>{`
               .bg-grid-pattern { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0); background-size: 20px 20px; }
               .text-glow { text-shadow: 0 0 8px rgba(167, 139, 250, 0.6); }
            `}</style>
            <div className="bg-gray-900 text-white min-h-screen font-sans bg-grid-pattern animate-fade-in">
                {/* Header */}
                <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-800">
                    <div className="flex items-center">
                        <img 
                            src={logoUrl} 
                            alt="Logo Lean Film Design" 
                            className="h-10"
                            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x50/111827/ffffff?text=Lean+Film+Design'; }}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setAuthAction('login')} className="text-gray-300 hover:text-white transition-colors">Login</button>
                        <button onClick={() => setAuthAction('signup')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Cadastre-se
                        </button>
                    </div>
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="text-center py-20 md:py-32 px-6">
                        <img 
                            src={logoUrl} 
                            alt="Logo Lean Film Design" 
                            className="h-24 mx-auto mb-8"
                            onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                        />
                        <h1 className="text-4xl md:text-6xl font-extrabold text-glow tracking-tight">Dê Vida às Suas Histórias.</h1>
                        <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">A plataforma definitiva para roteiristas e cineastas que transforma ideias brutas em roteiros prontos para produção. Analise, estruture e escreva com o poder da inteligência artificial.</p>
                        <div className="mt-8">
                             <button onClick={() => setAuthAction('signup')} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105 active:scale-100 flex items-center mx-auto">
                                Comece Gratuitamente <ArrowRight className="ml-2" size={20} />
                            </button>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section id="features" className="py-16 md:py-24 bg-gray-900/50 px-6">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold">Tudo que Você Precisa em um só Lugar</h2>
                                <p className="mt-3 text-gray-400 max-w-2xl mx-auto">Desde a primeira faísca de uma ideia até o documento de pitching final, nossas ferramentas foram desenhadas para acompanhar sua jornada criativa.</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {features.map((feature, index) => (
                                    <div key={index} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-indigo-500 hover:-translate-y-2 transition-all duration-300">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500/20 mb-4">
                                            <feature.icon className="text-indigo-400" size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    
                    {/* Creator's Quote Section */}
                    <section className="py-16 md:py-24 bg-gray-900 px-6">
                        <div className="max-w-3xl mx-auto">
                            <blockquote className="text-center text-lg md:text-xl italic text-gray-300 leading-relaxed">
                                <p>“Eu passei anos no set dirigindo, escrevendo roteiros e na sala de aula, e vi de perto o potencial incrível de tantos criadores ser desperdiçado pela falta de um método. O Lean Film Design nasceu do meu desejo de criar uma ponte entre a alma de uma história e a lógica do mercado. Este aplicativo não substitui o seu talento; ele o potencializa. É o seu assistente criativo 24 horas por dia, uma bússola para organizar o caos da criação e transformar suas ideias mais ousadas em realidade.”</p>
                            </blockquote>
                             <footer className="mt-6 text-center text-indigo-400 font-semibold">
                                — Guto Aeraphe, Cineasta e Criador do Lean Film Design
                            </footer>
                        </div>
                    </section>
                    
                    {/* Pricing Section */}
                    <section id="pricing" className="py-16 md:py-24 px-6">
                        <div className="max-w-4xl mx-auto">
                           <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold">Escolha o Plano Perfeito para Você</h2>
                                <p className="mt-3 text-gray-400">Comece de graça e evolua quando estiver pronto. Simples e transparente.</p>
                            </div>
                            <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
                                {/* Free Plan */}
                                <div className="w-full lg:w-1/2 bg-gray-800 p-8 rounded-xl border border-gray-700">
                                    <h3 className="text-2xl font-bold text-indigo-400">Plano Gratuito (Trial)</h3>
                                    <p className="mt-2 text-gray-400">Experimente todo o poder da plataforma.</p>
                                    <p className="text-4xl font-bold my-6">R$ 0<span className="text-lg font-normal text-gray-400">/ 7 dias</span></p>
                                    <ul className="space-y-3 text-gray-300">
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Acesso ilimitado a todas as funcionalidades</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Projetos ilimitados</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Análises de IA ilimitadas</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Sem necessidade de cartão de crédito</li>
                                    </ul>
                                    <button onClick={() => setAuthAction('signup')} className="w-full mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">
                                        Iniciar Teste Gratuito
                                    </button>
                                </div>
                                
                                {/* Pro Plan */}
                                <div className="w-full lg:w-1/2 bg-indigo-900/50 p-8 rounded-xl border-2 border-indigo-500 relative">
                                    <div className="absolute top-0 -translate-y-1/2 bg-indigo-500 text-white text-sm font-bold px-4 py-1 rounded-full">MAIS POPULAR</div>
                                    <h3 className="text-2xl font-bold text-white">Plano Pro</h3>
                                    <p className="mt-2 text-indigo-200">Liberte todo o seu potencial criativo.</p>
                                    <p className="text-4xl font-bold my-6">R$ 59,90<span className="text-lg font-normal text-indigo-200">/mês</span></p>
                                     <ul className="space-y-3 text-gray-300">
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Acesso ilimitado a todas as funcionalidades</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Projetos ilimitados</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Suporte prioritário por e-mail</li>
                                        <li className="flex items-center"><CheckSquare className="text-green-400 mr-3" />Acesso antecipado a novas funcionalidades</li>
                                    </ul>
                                    <button onClick={() => setAuthAction('signup')} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors">
                                        Assinar Agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    {/* Testimonials Section */}
                    <section className="py-16 md:py-24 bg-gray-900/50 px-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold">Amado por Criadores de Histórias</h2>
                            </div>
                            <div className="grid md:grid-cols-1 gap-8">
                                {testimonials.map((testimonial, index) => (
                                    <div key={index} className="bg-gray-800 p-6 rounded-lg text-center">
                                        <p className="text-lg italic text-gray-300">"{testimonial.quote}"</p>
                                        <p className="mt-4 font-bold text-white">{testimonial.name}</p>
                                        <p className="text-sm text-indigo-400">{testimonial.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                     <section id="faq" className="py-16 md:py-24 px-6">
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold">Perguntas Frequentes</h2>
                            </div>
                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <HelpAccordion key={index} title={faq.question}>
                                        <p>{faq.answer}</p>
                                    </HelpAccordion>
                                ))}
                            </div>
                        </div>
                    </section>

                </main>

                {/* Footer */}
                <footer className="bg-gray-800/50 border-t border-gray-700 py-8 px-6">
                    <div className="max-w-6xl mx-auto text-center text-gray-400">
                        <div className="flex justify-center items-center mb-4">
                             <img 
                                src={logoUrl} 
                                alt="Logo Lean Film Design" 
                                className="h-8"
                                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x40/1f2937/ffffff?text=Lean+Film+Design'; }}
                            />
                        </div>
                        <div className="flex justify-center space-x-6 my-4">
                            <button onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors">Termos de Uso</button>
                            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-white transition-colors">Política de Privacidade</button>
                            <a href="mailto:atendimento@cmkfilmes.com" className="hover:text-white transition-colors">Contato</a>
                        </div>
                        <p className="text-sm">&copy; {new Date().getFullYear()} CINEMARKETING CONTEÚDO E ENTRETENIMENTO LTDA. Todos os direitos reservados.</p>
                    </div>
                </footer>
            </div>
            {/* Gerenciamento de Modais */}
            {authAction === 'login' && <LoginModal onClose={() => setAuthAction(null)} onLogin={onLogin} onSwitchToSignUp={() => setAuthAction('signup')} />}
            {authAction === 'signup' && <SignUpModal onClose={() => setAuthAction(null)} onLogin={onLogin} onOpenTerms={() => setIsTermsOpen(true)} onOpenPrivacy={() => setIsPrivacyOpen(true)} onSwitchToLogin={() => setAuthAction('login')} />}
            {isTermsOpen && <LegalModal title="Termos de Uso" content={termsContent} onClose={() => setIsTermsOpen(false)} />}
            {isPrivacyOpen && <LegalModal title="Política de Privacidade" content={privacyContent} onClose={() => setIsPrivacyOpen(false)} />}
        </>
    );
};

// Componente da Barra Lateral
const Sidebar = ({ setCurrentPage, currentPage, onLogout }) => {
  const logoUrl = "https://i.imgur.com/Ls0PPoo.png";
  const navItems = [
    { id: 'projects', icon: FolderKanban, label: 'Meus Projetos' },
    { id: 'analysis', icon: BarChart, label: 'Análise de Narrativa' },
    { id: 'editor', icon: FileText, label: 'Editor de Roteiro' },
    { id: 'argument-generator', icon: Lightbulb, label: 'Gerador de Argumento' },
    { id: 'pitching-generator', icon: Clapperboard, label: 'Gerador de Pitching' },
    { id: 'chat', icon: Bot, label: 'Consultor IA' },
  ];

  const bottomNavItems = [
    { id: 'settings', icon: Settings, label: 'Configurações' },
    { id: 'help', icon: HelpCircle, label: 'Ajuda' },
  ];
  
  return (
    <nav className="fixed left-0 top-0 h-full bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 text-white w-16 md:w-64 flex flex-col justify-between transition-all duration-300 z-30 shadow-2xl">
      <div>
        <div className="flex items-center justify-center p-3 border-b border-gray-700" style={{ height: '88px' }}>
            <img
                src={logoUrl}
                alt="Logo Lean Film Design"
                className="h-16 object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x64/1a202c/ffffff?text=Lean+Film+Design'; }}
            />
        </div>
        <ul>
          {navItems.map(item => (
            <li key={item.id} className={`my-2 mx-2 rounded-lg transition-colors duration-200 ${currentPage === item.id ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
              <button onClick={() => setCurrentPage(item.id)} className="w-full flex items-center p-3">
                <item.icon size={20} />
                <span className="hidden md:block ml-4">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
       <div>
        <ul>
           {bottomNavItems.map(item => (
            <li key={item.id} className={`my-2 mx-2 rounded-lg transition-colors duration-200 ${currentPage === item.id ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
              <button onClick={() => setCurrentPage(item.id)} className="w-full flex items-center p-3">
                <item.icon size={20} />
                <span className="hidden md:block ml-4">{item.label}</span>
              </button>
            </li>
          ))}
           <li className="my-2 mx-2 rounded-lg transition-colors duration-200 hover:bg-red-500/80">
              <button onClick={onLogout} className="w-full flex items-center p-3 text-red-300 hover:text-white">
                <LogOut size={20} />
                <span className="hidden md:block ml-4">Sair</span>
              </button>
            </li>
        </ul>
      </div>
    </nav>
  );
};

// Componente do Menu de Ações
const ActionMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white transition-colors">
                <MoreVertical size={20} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 animate-fade-in-fast" onMouseLeave={() => setIsOpen(false)}>
                    <ul className="py-1">
                        {children}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Módulo: Gerenciamento de Projetos (Atualizado)
const ProjectDashboard = ({ projects, trash, handleCreateNew, handleFileSelect, handleDeleteProject, handleDeleteFile, handleRestoreItem, handlePermanentDelete }) => {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Projetos</h1>
        <button onClick={() => handleCreateNew('project')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all transform hover:scale-105 active:scale-100">
          <Plus size={20} className="mr-2" /> Novo Projeto
        </button>
      </div>
      <div className="space-y-6">
        {projects.map(project => (
          <div key={project.id} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
              <h2 className="text-2xl font-semibold flex items-center"><Folder size={28} className="mr-3 text-indigo-400"/>{project.name}</h2>
              <ActionMenu>
                  <li><button onClick={() => handleDeleteProject(project.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center"><Trash size={16} className="mr-2"/>Excluir Projeto</button></li>
              </ActionMenu>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                 <button onClick={() => handleCreateNew('script', project)} className="bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <FilePlus2 size={16} className="mr-2"/>Criar Roteiro
                 </button>
                 <button onClick={() => handleCreateNew('argument', project)} className="bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <Lightbulb size={16} className="mr-2"/>Criar Argumento
                 </button>
                 <button onClick={() => handleCreateNew('upload', project)} className="bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <Upload size={16} className="mr-2"/>Fazer Upload
                 </button>
            </div>

            <div className="space-y-2">
              {project.files.map(file => (
                <li key={file.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md hover:bg-gray-700 transition-colors group">
                  <span className="flex items-center truncate">
                    {file.type === 'script' ? <FileText size={18} className="mr-3 flex-shrink-0 text-green-400" /> : <Lightbulb size={18} className="mr-3 flex-shrink-0 text-yellow-400" />}
                    <span className="truncate">{file.name}</span>
                  </span>
                  <ActionMenu>
                      <li><button onClick={() => { const page = file.type === 'argument' ? 'argument-generator' : 'editor'; handleFileSelect(file, page); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center"><Pencil size={16} className="mr-2"/>Editar</button></li>
                      {file.type === 'script' && <li><button onClick={() => handleFileSelect(file, 'analysis')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center"><BarChart size={16} className="mr-2"/>Analisar</button></li>}
                      {file.type === 'script' && <li><button onClick={() => handleFileSelect(file, 'pitching-generator')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center"><Clapperboard size={16} className="mr-2"/>Gerar Pitching</button></li>}
                      <li><button onClick={() => handleFileSelect(file, 'chat')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center"><Bot size={16} className="mr-2"/>Consultor IA</button></li>
                      <li><button onClick={() => handleDeleteFile(project.id, file.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center"><Trash size={16} className="mr-2"/>Excluir</button></li>
                  </ActionMenu>
                </li>
              ))}
              {project.files.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum arquivo neste projeto. Crie ou faça o upload de um arquivo.</p>}
            </div>
          </div>
        ))}
      </div>
       <div className="mt-8 bg-gray-800 p-5 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 flex items-center"><Trash2 size={22} className="mr-3 text-red-500" /> Lixeira</h2>
          {trash.length > 0 ? (
            <ul className="space-y-2">
                {trash.map(item => (
                    <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md hover:bg-gray-700 transition-colors">
                        <span className="flex items-center">
                            {item.itemType === 'project' ? <Folder size={18} className="mr-2 text-gray-400"/> : (item.type === 'script' ? <FileText size={18} className="mr-2 text-gray-400" /> : <Lightbulb size={18} className="mr-2 text-gray-400" />)}
                            {item.name}
                        </span>
                        <div className="flex items-center space-x-3">
                            <button onClick={() => handleRestoreItem(item)} className="text-green-400 hover:text-green-300 flex items-center text-sm"><Undo size={14} className="mr-1"/>Restaurar</button>
                            <button onClick={() => handlePermanentDelete(item.id)} className="text-red-400 hover:text-red-300 flex items-center text-sm"><Trash size={14} className="mr-1"/>Excluir</button>
                        </div>
                    </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-400">Nenhum item na lixeira. Itens são mantidos por 30 dias.</p>
          )}
      </div>
    </div>
  );
};


// Módulo: Dashboard de Análise
const AnalysisDashboard = ({ setCurrentPage, script }) => {
  const [activeTab, setActiveTab] = useState('structure');
  
  const renderAnalysisTab = () => {
    switch (activeTab) {
      case 'structure': return <NarrativeStructureAnalysis scriptContent={script?.content} />;
      case 'dramaturgy': return <DramaturgyCanvas scriptContent={script?.content}/>;
      case 'characters': return <CharacterAnalysis scriptContent={script?.content} />;
      case 'market': return <MarketAnalysis scriptContent={script?.content} />;
      default: return null;
    }
  };

  if (!script || script.type !== 'script') {
    return (
        <div className="text-center animate-fade-in">
            <h2 className="text-2xl mb-4">Nenhum Roteiro Selecionado</h2>
            <p className="text-gray-400 mb-4">Por favor, selecione um roteiro em "Meus Projetos" para analisar.</p>
            <button onClick={() => setCurrentPage('projects')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-100">Ir para Projetos</button>
        </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Análise: {script.name}</h1>
            <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white transition-colors">&larr; Voltar</button>
        </div>
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
            <button className={`py-2 px-4 whitespace-nowrap transition-colors ${activeTab === 'structure' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('structure')}>Estrutura</button>
            <button className={`py-2 px-4 whitespace-nowrap transition-colors ${activeTab === 'dramaturgy' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('dramaturgy')}>Canvas de Dramaturgia</button>
            <button className={`py-2 px-4 whitespace-nowrap transition-colors ${activeTab === 'characters' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('characters')}>Personagens</button>
            <button className={`py-2 px-4 whitespace-nowrap transition-colors ${activeTab === 'market' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('market')}>Mercado</button>
        </div>
        <div className="animate-fade-in"> {renderAnalysisTab()} </div>
    </div>
  );
};

// Componente Accordion
const Accordion = ({ title, children, prompt, defaultOpen = false, isIdentified = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateContent = useCallback(async () => {
        if (!prompt || !isIdentified) {
            setIsLoading(false);
            if (!isIdentified) setContent("Passo não identificado no roteiro.");
            return;
        };
        setIsLoading(true);
        const response = await callGeminiApi(prompt);
        setContent(response);
        setIsLoading(false);
    }, [prompt, isIdentified]);

    useEffect(() => {
        if(isOpen && !content && isIdentified) {
            generateContent();
        }
    }, [isOpen, content, generateContent, isIdentified]);


    return (
        <div className="bg-gray-800 rounded-lg">
            <button onClick={() => isIdentified && setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:cursor-not-allowed" disabled={!isIdentified}>
                <h3 className={`text-lg font-semibold ${isIdentified ? 'text-indigo-400' : 'text-gray-500'}`}>{title}</h3>
                {isIdentified && <ChevronDown size={24} className={`transition-transform transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700 animate-fade-in-fast">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                            <LoaderCircle size={24} className="animate-spin text-indigo-400"/>
                        </div>
                    ) : (
                         <div className="text-gray-300 space-y-2">{children(content)}</div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- NOVOS COMPONENTES PARA ANÁLISE DE ESTRUTURA ---
const NarrativeStructureAnalysis = ({ scriptContent }) => {
  const criteriaData = [
      { subject: 'Equilíbrio', score: 4, fullMark: 5 }, { subject: 'Tensão', score: 5, fullMark: 5 },
      { subject: 'Unidade', score: 4, fullMark: 5 }, { subject: 'Contraste', score: 4, fullMark: 5 },
      { subject: 'Direcionalidade', score: 3, fullMark: 5 },
  ];
  
  const journeyData = [ 
      { name: "Mundo Comum", intensity: 2, identified: true }, { name: "Chamado", intensity: 4, identified: true }, 
      { name: "Recusa", intensity: 3, identified: false }, { name: "Mentor", intensity: 5, identified: true }, 
      { name: "Travessia", intensity: 6, identified: true }, { name: "Testes", intensity: 5, identified: true }, 
      { name: "Aproximação", intensity: 7, identified: true }, { name: "Provação", intensity: 9, identified: true }, 
      { name: "Recompensa", intensity: 8, identified: false }, { name: "Retorno", intensity: 6, identified: true }, 
      { name: "Ressurreição", intensity: 10, identified: true }, { name: "Elixir", intensity: 7, identified: true } 
  ];

  const formatAIResponse = (text) => {
      if (text === "Passo não identificado no roteiro.") {
          return <p className="text-gray-400">{text}</p>;
      }
      const parts = text.split('\n\n');
      return parts.map((part, index) => {
          if(part.toLowerCase().startsWith('análise:') || part.toLowerCase().startsWith('sugestão:')) {
              const [title, ...body] = part.split(':');
              return <p key={index}><strong className="text-indigo-300">{title}:</strong> {body.join(':').trim()}</p>
          }
          return <p key={index}>{part}</p>
      })
  }
  
  return (
      <div className="space-y-8">
          <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">Análise por Critérios</h2>
              <div className="bg-gray-800 p-5 rounded-lg flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/3 text-center">
                      <p className="text-lg text-gray-400">Pontuação Média</p>
                      <p className="text-6xl font-bold text-indigo-400">4.2</p>
                      <p className="text-green-400 mt-2">Roteiro maduro com grande potencial.</p>
                  </div>
                  <div className="w-full md:w-2/3 h-64">
                      <ResponsiveContainer>
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={criteriaData}>
                              <PolarGrid gridType="circle" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#E5E7EB' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                              <Radar name="Pontuação" dataKey="score" stroke="#818CF8" fill="#818CF8" fillOpacity={0.6} />
                          </RadarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-2">
                  {criteriaData.map(criterion => (
                      <Accordion 
                        key={criterion.subject} 
                        title={criterion.subject}
                        prompt={scriptContent ? `Para o roteiro a seguir, forneça uma análise e uma sugestão para o critério narrativo de "${criterion.subject}". Seja conciso e objetivo. Use o formato: 'Análise: [texto] \n\n Sugestão: [texto]'. Roteiro: ${scriptContent}` : null}
                       >
                          {(content) => formatAIResponse(content)}
                       </Accordion>
                  ))}
              </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">Análise da Jornada do Herói</h2>
              <div className="bg-gray-800 p-5 rounded-lg">
                   <h3 className="text-xl font-semibold mb-3">Curva de Intensidade Dramática</h3>
                    <div className="w-full h-72">
                         <ResponsiveContainer>
                            <LineChart data={journeyData.filter(d => d.identified)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} fontSize={10} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis tick={{ fill: '#9CA3AF' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
                                <Legend />
                                <Line type="monotone" dataKey="intensity" name="Intensidade" stroke="#818CF8" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-2">
                  {journeyData.map((step, index) => (
                      <Accordion 
                        key={step.name}
                        title={`${index + 1}. ${step.name}`}
                        isIdentified={step.identified}
                        prompt={scriptContent && step.identified ? `Para o roteiro a seguir, identifique a seção que corresponde ao passo "${step.name}" da Jornada do Herói. Faça uma breve análise e dê uma sugestão para melhorá-lo. Seja conciso e use o formato: 'Análise: [texto] \n\n Sugestão: [texto]'. Roteiro: ${scriptContent}` : null}
                      >
                           {(content) => formatAIResponse(content)}
                      </Accordion>
                  ))}
              </div>
          </div>
      </div>
  );
};


const DramaturgyCanvas = ({ scriptContent }) => {
    const canvasPoints = [
        { title: "Evento Desencadeador", prompt: `Analise o "Evento Desencadeador" no roteiro a seguir, focando em como ele desestabiliza o protagonista e inicia a trama. Roteiro: ${scriptContent}`},
        { title: "Questão Dramática Principal", prompt: `Analise a "Questão Dramática Principal" no roteiro a seguir, focando na reação do protagonista e na pressão que ele sofre. Roteiro: ${scriptContent}`},
        { title: "Objetivo do Protagonista", prompt: `Analise o "Objetivo do Protagonista" que emerge após o evento desencadeador no roteiro a seguir. Roteiro: ${scriptContent}`},
        { title: "Obstáculos e Conflitos Principais", prompt: `Analise os "Obstáculos e Conflitos Principais" (internos e externos) no roteiro a seguir. Roteiro: ${scriptContent}`},
        { title: "Clímax", prompt: `Analise o "Clímax" da história no roteiro a seguir, focando na tensão e no confronto decisivo. Roteiro: ${scriptContent}`},
        { title: "Resolução", prompt: `Analise a "Resolução" e suas consequências para o protagonista no roteiro a seguir. Roteiro: ${scriptContent}`},
        { title: "Tema Central", prompt: `Analise como o "Tema Central" é explorado e resolvido ao final da jornada do protagonista no roteiro a seguir. Roteiro: ${scriptContent}`},
    ];

    const formatAIResponse = (text) => <p>{text}</p>;

    return (
        <div className="animate-fade-in space-y-2">
            {canvasPoints.map(point => (
                <Accordion 
                    key={point.title} 
                    title={point.title}
                    prompt={scriptContent ? point.prompt : null}
                >
                    {(content) => formatAIResponse(content)}
                </Accordion>
            ))}
        </div>
    );
};

const CharacterAnalysis = ({ scriptContent }) => {
    const characterPoints = [
        "Perfil Psicológico e Personalidade", "Forças", "Fraquezas", "Motivações", "Sugestões para Melhorar"
    ];

    const formatAIResponse = (text) => <p>{text}</p>;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-gray-800/50 p-6 rounded-lg space-y-2">
                <h2 className="text-2xl font-bold mb-4 text-green-400">Protagonista</h2>
                {characterPoints.map(point => (
                     <Accordion 
                        key={`protagonist-${point}`} 
                        title={point}
                        prompt={scriptContent ? `Para o protagonista do roteiro a seguir, faça uma análise sobre o seguinte ponto: "${point}". Seja objetivo e limite a 1500 caracteres. Roteiro: ${scriptContent}` : null}
                    >
                        {(content) => formatAIResponse(content)}
                    </Accordion>
                ))}
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg space-y-2">
                <h2 className="text-2xl font-bold mb-4 text-red-400">Antagonista</h2>
                 {characterPoints.map(point => (
                     <Accordion 
                        key={`antagonist-${point}`} 
                        title={point}
                        prompt={scriptContent ? `Para o antagonista do roteiro a seguir, faça uma análise sobre o seguinte ponto: "${point}". Seja objetivo e limite a 1500 caracteres. Roteiro: ${scriptContent}` : null}
                    >
                        {(content) => formatAIResponse(content)}
                    </Accordion>
                ))}
            </div>
        </div>
    );
};
const MarketAnalysis = ({ scriptContent }) => {
     const marketPoints = [
        { title: "Análise do Público-Alvo", prompt: `Para o roteiro a seguir, faça uma análise concisa do público-alvo ideal (demográfico e psicográfico), em um parágrafo. Roteiro: ${scriptContent}`},
        { title: "Análise de Conteúdo e Tendências", prompt: `Analise o tema principal do roteiro a seguir e compare-o com as tendências atuais do mercado, de forma objetiva. Roteiro: ${scriptContent}`},
        { title: "Originalidade e Potencial de Mercado", prompt: `Identifique os aspectos de originalidade e o potencial de mercado do roteiro a seguir, de forma resumida. Roteiro: ${scriptContent}`},
        { title: "Sugestões de Conteúdos Complementares", prompt: `Sugira 3 conteúdos ou produtos complementares para o universo do roteiro a seguir. Roteiro: ${scriptContent}`},
        { title: "Obras de Referência (Benchmarking)", prompt: `Identifique 2 obras similares ao roteiro a seguir e faça uma breve análise comparativa dos seus pontos fortes e fracos. Roteiro: ${scriptContent}`},
        { title: "Palavras-chave e Tags Estratégicas", prompt: `Sugira 5 palavras-chave e 5 tags estratégicas para a divulgação do projeto baseado no roteiro a seguir. Roteiro: ${scriptContent}`},
        { title: "Sugestões de Canais de Distribuição", prompt: `Com base no roteiro a seguir, sugira os 3 canais de distribuição/exibição mais adequados e justifique brevemente. Roteiro: ${scriptContent}`},
        { title: "Potencial de Apelo Internacional", prompt: `Avalie o potencial de apelo internacional do roteiro a seguir em um parágrafo objetivo. Roteiro: ${scriptContent}`},
    ];

    const formatAIResponse = (text) => <p>{text}</p>;

    return (
        <div className="animate-fade-in space-y-2">
            {marketPoints.map(point => (
                <Accordion 
                    key={point.title} 
                    title={point.title}
                    prompt={scriptContent ? point.prompt : null}
                >
                    {(content) => formatAIResponse(content)}
                </Accordion>
            ))}
        </div>
    );
};

// Barra de Ferramentas de Formatação
const FormattingToolbar = ({ onFormat }) => {
    const tools = [
        { label: 'Cena', format: '\n\nCENA INT. LOCAL - DIA\n\n' },
        { label: 'Ação', format: 'Descrição da ação.' },
        { label: 'Personagem', format: '\n\nPERSONAGEM\n' },
        { label: 'Diálogo', format: 'Fala do personagem.' },
        { label: 'Parêntese', format: '(emoção)\n' },
        { label: 'Transição', format: '\n\nCORTA PARA:\n' },
    ];

    return (
        <div className="bg-gray-700/50 p-1 flex items-center space-x-2 animate-fade-in-fast">
            {tools.map(tool => (
                <button key={tool.label} onClick={() => onFormat(tool.format)} className="text-xs px-3 py-1 bg-gray-600 hover:bg-indigo-500 rounded transition-all transform hover:scale-110 active:scale-100">
                    {tool.label}
                </button>
            ))}
        </div>
    );
};

// Módulo: Editor de Roteiro com Formatação Automática
const ScriptEditor = ({ setCurrentPage, script, projects, setScriptContent }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('edit');
    const [selection, setSelection] = useState({ start: 0, end: 0, text: '' });
    const textareaRef = useRef(null);
    const [isSceneModalOpen, setSceneModalOpen] = useState(false);

    const getLinkedArgumentContent = () => {
        if (!script || !script.argument) return '';
        const project = projects.find(p => p.files.some(f => f.id === script.id));
        const argumentFile = project?.files.find(f => f.type === 'argument' && f.name === script.argument);
        return argumentFile ? argumentFile.content : '';
    };

    const handleSelectionChange = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value.substring(start, end);
            setSelection({ start, end, text });
        }
    };
    
    const improveText = async () => {
        if (!selection.text) return;
        setIsLoading(true);
        const argumentContext = getLinkedArgumentContent();
        const prompt = `Considerando o seguinte roteiro e seu argumento, melhore o trecho selecionado.\n\nArgumento: """${argumentContext}"""\n\nRoteiro: """${script.content}"""\n\nTrecho selecionado para melhorar: "${selection.text}"\n\nResponda apenas com o texto melhorado.`;
        const improvedText = await callGeminiApi(prompt);

        const newContent = script.content.substring(0, selection.start) + improvedText + script.content.substring(selection.end);
        setScriptContent(newContent);
        setIsLoading(false);
    };

    const handleFormat = (format) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = script.content || '';
        const before = currentText.substring(0, start);
        const after = currentText.substring(end);
        
        let newText = before + format + after;
        
        newText = newText.replace(/(\n\n\n)/g, '\n\n');

        setScriptContent(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + format.length;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
    };

    const exportScript = () => {
        if (!script || !script.content) return;
        const blob = new Blob([script.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${script.name.replace(/ /g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerateScene = async ({ tone, objective }) => {
        if (!script) return;
        setIsLoading(true);
        setSceneModalOpen(false);
        const argumentContext = getLinkedArgumentContent();
        const prompt = `Com base no roteiro e argumento, crie uma nova cena.\n\nArgumento: """${argumentContext}"""\n\nRoteiro: """${script.content}"""\n\nTom da cena: ${tone}\nObjetivo da cena: ${objective}\n\nEscreva a cena completa no formato de roteiro padrão Master Scene. Responda apenas com o texto da cena, sem incluir marcadores como \`\`\`screenplay ou [INÍCIO DA CENA].`;
        const response = await callGeminiApi(prompt);
        setScriptContent(script.content + `\n\n${response}`);
        setIsLoading(false);
    };


    if (!script || script.type !== 'script') {
        return (
            <div className="text-center animate-fade-in">
                <h2 className="text-2xl mb-4">Nenhum Roteiro Selecionado</h2>
                <p className="text-gray-400 mb-4">Por favor, selecione ou crie um roteiro em "Meus Projetos" para editar.</p>
                <button onClick={() => setCurrentPage('projects')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Ir para Projetos</button>
            </div>
        );
    }
    
     const lineCount = (script.content || '').split('\n').length;
     const pageCount = Math.ceil(lineCount / 55); // Aproximadamente 55 linhas por página

    return (
        <div className="animate-fade-in h-full flex flex-col">
            {isSceneModalOpen && <GenerateSceneModal onGenerate={handleGenerateScene} onClose={() => setSceneModalOpen(false)} />}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Editor: {script.name}</h1>
                <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white">&larr; Voltar</button>
            </div>
            <div className="bg-gray-800 p-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setSceneModalOpen(true)} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100">
                        {isLoading ? <LoaderCircle size={18} className="animate-spin mr-2" /> : <Clapperboard size={18} className="mr-2" />} Gerar Cena
                    </button>
                    <button onClick={improveText} disabled={isLoading || !selection.text} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100">
                        <Wand2 size={18} className="mr-2" /> Melhorar Texto
                    </button>
                </div>
                 <div className="flex items-center bg-gray-700 rounded-lg p-1">
                     <span className="text-xs px-3 text-gray-400">Páginas: ~{pageCount}</span>
                     <button onClick={() => setViewMode('edit')} className={`p-2 rounded transition-colors ${viewMode === 'edit' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`} title="Modo Edição"><Pencil size={18}/></button>
                     <button onClick={() => setViewMode('view')} className={`p-2 rounded transition-colors ${viewMode === 'view' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`} title="Modo Visualização"><Eye size={18}/></button>
                </div>
            </div>
            
             {viewMode === 'edit' && <FormattingToolbar onFormat={handleFormat} />}

            <div className="flex-1 w-full bg-gray-900 rounded-b-lg border-t-2 border-gray-700 overflow-y-auto">
                 {viewMode === 'edit' ? (
                     <textarea
                        ref={textareaRef}
                        className="w-full h-full bg-gray-900 p-6 font-mono text-base leading-7 focus:outline-none"
                        value={script.content}
                        onChange={(e) => setScriptContent(e.target.value)}
                        onSelect={handleSelectionChange}
                        placeholder="Comece a escrever seu roteiro..."
                    />
                 ) : (
                     <FormattedScriptViewer content={script.content} />
                 )}
            </div>

            <div className="mt-4 flex justify-end space-x-4">
                <button onClick={() => alert('Salvo com sucesso!')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-100">Salvar</button>
                <button onClick={exportScript} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-100">Exportar (.txt)</button>
            </div>
        </div>
    );
};

// Modal para Gerar Cena
const GenerateSceneModal = ({ onGenerate, onClose }) => {
    const [tone, setTone] = useState('');
    const [objective, setObjective] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate({ tone, objective });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in-fast">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-scale-in">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold">Gerar Nova Cena</h2>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Tom da Cena</label>
                        <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Ex: Tensa, cômica, romântica..." required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Objetivo da Cena</label>
                        <textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full bg-gray-700 p-2 rounded h-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Ex: Revelar que o detetive tem uma pista nova." required></textarea>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 p-2 px-4 rounded transition-colors">Cancelar</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 p-2 px-4 rounded transition-colors">Gerar Cena</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Componente para Visualizar Roteiro Formatado
const FormattedScriptViewer = ({ content }) => {
    const LINES_PER_PAGE = 55;
    const lines = (content || '').split('\n');
    const pages = [];

    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
        pages.push(lines.slice(i, i + LINES_PER_PAGE));
    }

    const getLineType = (line, prevLine) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('CENA') || trimmedLine.startsWith('INT.') || trimmedLine.startsWith('EXT.')) return 'scene-heading';
        if (trimmedLine.match(/^[A-Z\s\(\)0-9\._-]+$/) && trimmedLine.length > 1 && !trimmedLine.endsWith(':') && (prevLine === '' || prevLine === undefined)) return 'character';
        if (prevLine && prevLine.trim().match(/^[A-Z\s\(\)0-9\._-]+$/)) {
            if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) return 'parenthetical';
            return 'dialogue';
        }
        if (trimmedLine.endsWith(':') && trimmedLine.match(/^[A-Z\s]+:$/)) return 'transition';
        return 'action';
    };

    return (
        <div className="p-8 font-mono text-sm leading-6 text-gray-200 bg-gray-900">
            {pages.map((pageLines, pageIndex) => (
                <div key={pageIndex} className="page-container relative mb-8 p-4 border border-gray-700 shadow-lg" style={{ minHeight: '11in' }}>
                    <div className="absolute top-2 right-4 text-xs text-gray-500">{pageIndex + 1}</div>
                     {pageLines.map((line, index) => {
                        const prevLine = index > 0 ? pageLines[index - 1] : (pageIndex > 0 ? pages[pageIndex-1].slice(-1)[0] : '');
                        const type = getLineType(line, prevLine);
                        
                        switch (type) {
                            case 'scene-heading': return <p key={index} className="font-bold uppercase my-4">{line}</p>;
                            case 'character': return <p key={index} className="uppercase text-center mt-4 mb-1">{line}</p>;
                            case 'dialogue': return <p key={index} className="text-center max-w-sm mx-auto">{line}</p>;
                            case 'parenthetical': return <p key={index} className="text-center text-gray-400">{line}</p>;
                            case 'transition': return <p key={index} className="uppercase text-right mt-4">{line}</p>;
                            case 'action': default: return <p key={index} className="my-2">{line || <>&nbsp;</>}</p>;
                        }
                    })}
                     {pageIndex < pages.length - 1 && <hr className="mt-4 border-dashed border-gray-600" />}
                </div>
            ))}
        </div>
    );
};


// --- Módulo: Gerador de Argumento (IMPLEMENTAÇÃO DA ABA DE ARGUMENTO CONSOLIDADO) ---
const ArgumentGenerator = ({ setCurrentPage, argumentFile, setArgumentFile }) => {
    const [activeTab, setActiveTab] = useState('themes');
    
    const [argumentData, setArgumentDataState] = useState(argumentFile ? argumentFile.content : null);

    useEffect(() => {
        if (argumentFile && argumentFile.content) {
            setArgumentDataState(argumentFile.content);
        }
    }, [argumentFile]);

    const setArgumentData = (newArgumentData) => {
        setArgumentDataState(newArgumentData);
        setArgumentFile({ ...argumentFile, content: newArgumentData });
    };

    if (!argumentData) {
        return (
            <div className="text-center animate-fade-in">
                <h2 className="text-2xl mb-4">Nenhum Argumento Selecionado</h2>
                <p className="text-gray-400 mb-4">Por favor, selecione ou crie um argumento em "Meus Projetos" para começar.</p>
                <button onClick={() => setCurrentPage('projects')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Ir para Projetos</button>
            </div>
        );
    }


    const renderTabContent = () => {
        switch (activeTab) {
            case 'themes':
                return <ThemesTab argumentData={argumentData} setArgumentData={setArgumentData} />;
            case 'characters':
                return <CharactersTab argumentData={argumentData} setArgumentData={setArgumentData} />;
            case 'narrative':
                return <NarrativeElementsTab argumentData={argumentData} setArgumentData={setArgumentData} />;
            case 'consolidated':
                return <ConsolidatedArgumentTab argumentData={argumentData} setArgumentData={setArgumentData} />;
            default:
                return <ThemesTab argumentData={argumentData} setArgumentData={setArgumentData} />;
        }
    };

    const tabs = [
        { id: 'themes', label: '1. Temas' },
        { id: 'characters', label: '2. Personagens' },
        { id: 'narrative', label: '3. Elementos da Narrativa' },
        { id: 'consolidated', label: '4. Argumento Consolidado' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerador de Argumento: <span className="text-indigo-400">{argumentFile.name}</span></h1>
                <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white">&larr; Voltar</button>
            </div>
            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

// --- Sub-componente da Aba de Temas ---
const ThemesTab = ({ argumentData, setArgumentData }) => {
    const [mainThemeInput, setMainThemeInput] = useState(argumentData.mainTheme || '');
    const [mainThemeDescription, setMainThemeDescription] = useState('');
    const [subThemes, setSubThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [regeneratingCardId, setRegeneratingCardId] = useState(null);
    
    const parseSubThemes = (text) => {
        const themeBlocks = text.split(/\d+\.\s*Título:/).slice(1);
        const themes = themeBlocks.map((block, index) => {
            const titleMatch = block.match(/(.*?)\n/);
            const explanationMatch = block.match(/Explicação:\s*(.*?)\n/);
            const justificationMatch = block.match(/Justificativa:\s*(.*?)\n/);
            const suggestionMatch = block.match(/Sugestão de Uso:\s*(.*)/s);

            return {
                id: Date.now() + index,
                title: titleMatch ? titleMatch[1].trim() : 'Sem Título',
                explanation: explanationMatch ? explanationMatch[1].trim() : '',
                justification: justificationMatch ? justificationMatch[1].trim() : '',
                suggestion: suggestionMatch ? suggestionMatch[1].trim() : '',
                isSelected: false
            };
        });
        return themes;
    };
    
    const handleGenerate = async () => {
        if (!mainThemeInput) return;
        setIsLoading(true);
        setMainThemeDescription('');
        setSubThemes([]);

        const descPrompt = `Descreva de forma objetiva e concisa, em um parágrafo, o seguinte tema para um filme: "${mainThemeInput}".`;
        const description = await callGeminiApi(descPrompt);
        setMainThemeDescription(description);
        
        const subThemesPrompt = `Para o tema de filme principal: "${mainThemeInput}", gere 4 temas secundários relevantes. Para cada um, forneça "Título", "Explicação", "Justificativa" e "Sugestão de Uso". Formate a resposta como uma lista numerada, separando cada campo claramente. Exemplo para um tema:\n1. Título: Vingança\nExplicação: O desejo de retaliação contra quem causou mal.\nJustificativa: Adiciona um forte motor de conflito para o protagonista.\nSugestão de Uso: O protagonista busca vingança pela morte de um ente querido, mas questiona o custo moral.`;
        const subThemesResponse = await callGeminiApi(subThemesPrompt);
        const parsedThemes = parseSubThemes(subThemesResponse);
        setSubThemes(parsedThemes);
        
        setArgumentData({ ...argumentData, mainTheme: mainThemeInput });
        setIsLoading(false);
    };

    const handleRegenerate = async (cardId) => {
        setRegeneratingCardId(cardId);
        const otherThemeTitles = subThemes.filter(t => t.id !== cardId).map(t => t.title).join(', ');
        const regenPrompt = `Para o tema de filme principal: "${mainThemeInput}", gere um novo tema secundário relevante que seja diferente de: ${otherThemeTitles}. Forneça "Título", "Explicação", "Justificativa" e "Sugestão de Uso" no mesmo formato da lista anterior. Comece com "1. Título: ...".`;
        
        const response = await callGeminiApi(regenPrompt);
        const newThemeArray = parseSubThemes(response);
        if (newThemeArray.length > 0) {
            setSubThemes(subThemes.map(theme => theme.id === cardId ? newThemeArray[0] : theme));
        }

        setRegeneratingCardId(null);
    };

    const handleSelect = (cardId) => {
        const updatedSubThemes = subThemes.map(theme =>
            theme.id === cardId ? { ...theme, isSelected: !theme.isSelected } : theme
        );
        setSubThemes(updatedSubThemes);
        setArgumentData({
            ...argumentData,
            selectedSubThemes: updatedSubThemes.filter(t => t.isSelected)
        });
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Defina o Tema Principal</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={mainThemeInput}
                        onChange={(e) => {
                            setMainThemeInput(e.target.value);
                            setArgumentData({ ...argumentData, mainTheme: e.target.value });
                        }}
                        placeholder="Ex: Vingança, redenção, a luta contra a tecnologia..."
                        className="flex-grow bg-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100">
                        {isLoading ? <LoaderCircle size={20} className="animate-spin" /> : 'Gerar Análise'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center p-8">
                    <LoaderCircle size={32} className="animate-spin mx-auto text-indigo-400" />
                    <p className="mt-4 text-gray-400">Analisando o tema e gerando ideias...</p>
                </div>
            )}
            
            {mainThemeDescription && !isLoading && (
                <div className="bg-gray-800/50 p-6 rounded-lg animate-fade-in">
                     <h2 className="text-xl font-bold mb-4">Descrição do Tema</h2>
                     <p className="text-gray-300">{mainThemeDescription}</p>
                </div>
            )}

            {subThemes.length > 0 && !isLoading && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-4">Selecione Temáticas Relevantes</h2>
                    <p className="text-gray-400 mb-6">A IA gerou algumas temáticas que podem enriquecer sua história. Selecione as que mais lhe agradam para compor o argumento.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {subThemes.map(theme => (
                             <div key={theme.id} className={`bg-gray-800 p-5 rounded-lg border-2 ${theme.isSelected ? 'border-indigo-500' : 'border-transparent'} transition-all`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                       <button onClick={() => handleSelect(theme.id)} className="mr-3">
                                           {theme.isSelected ? <CheckSquare size={24} className="text-indigo-400" /> : <Square size={24} className="text-gray-500" />}
                                       </button>
                                       <h3 className="text-lg font-bold text-indigo-300">{theme.title}</h3>
                                    </div>
                                    <button onClick={() => handleRegenerate(theme.id)} disabled={regeneratingCardId === theme.id} className="text-gray-400 hover:text-white disabled:text-gray-600 transition-colors">
                                       {regeneratingCardId === theme.id ? <LoaderCircle size={20} className="animate-spin"/> : <RefreshCw size={20} />}
                                    </button>
                                </div>
                                {regeneratingCardId === theme.id ? (
                                    <div className="text-center py-10 text-gray-400">Gerando nova temática...</div>
                                ) : (
                                    <div className="space-y-3 text-sm">
                                        <div><strong className="text-gray-300 block mb-1">Explicação:</strong><p className="text-gray-400">{theme.explanation}</p></div>
                                        <div><strong className="text-gray-300 block mb-1">Justificativa:</strong><p className="text-gray-400">{theme.justification}</p></div>
                                        <div><strong className="text-gray-300 block mb-1">Sugestão de Uso:</strong><p className="text-gray-400">{theme.suggestion}</p></div>
                                    </div>
                                )}
                             </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
};

// --- Sub-componente da Aba de Personagens ---
const CharactersTab = ({ argumentData, setArgumentData }) => {
    return (
        <div className="animate-fade-in space-y-8">
            <div>
                 <h2 className="text-xl font-bold mb-4">Desenvolva Seus Personagens</h2>
                 <p className="text-gray-400 mb-6">Preencha os campos abaixo para dar vida ao seu protagonista e antagonista. A IA usará essas informações para criar um resumo coeso que pode ser a base para o desenvolvimento do seu roteiro.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CharacterCard 
                    title="Protagonista"
                    characterType="protagonist"
                    argumentData={argumentData}
                    setArgumentData={setArgumentData}
                    color="green"
                />
                <CharacterCard 
                    title="Antagonista"
                    characterType="antagonist"
                    argumentData={argumentData}
                    setArgumentData={setArgumentData}
                    color="red"
                />
            </div>
        </div>
    );
};

// --- Card de Personagem Reutilizável ---
const CharacterCard = ({ title, characterType, argumentData, setArgumentData, color }) => {
    const [isLoading, setIsLoading] = useState(false);
    const characterData = argumentData.characters[characterType];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedCharacters = {
            ...argumentData.characters,
            [characterType]: {
                ...argumentData.characters[characterType],
                [name]: value
            }
        };
        setArgumentData({ ...argumentData, characters: updatedCharacters });
    };
    
    const handleGenerateSummary = async () => {
        setIsLoading(true);
        const { psicologico, forcas, fraquezas, motivacaoInterna, motivacaoExterna, motivacaoSocial } = characterData;
        const prompt = `Crie um resumo em prosa para um personagem (${title}) de um filme com base nas seguintes características. Integre as informações de forma natural e coesa.
        - Tema principal da história: ${argumentData.mainTheme || 'Não definido'}
        - Perfil Psicológico: ${psicologico || 'Não informado'}
        - Forças: ${forcas || 'Não informado'}
        - Fraquezas: ${fraquezas || 'Não informado'}
        - Motivação Interna: ${motivacaoInterna || 'Não informado'}
        - Motivação Externa: ${motivacaoExterna || 'Não informado'}
        - Motivação Social: ${motivacaoSocial || 'Não informado'}
        
        Responda apenas com o texto do resumo.`;

        const summary = await callGeminiApi(prompt);
        
        handleInputChange({ target: { name: 'summary', value: summary } });
        setIsLoading(false);
    };

    const fields = [
        { name: 'psicologico', label: 'Perfil Psicológico', placeholder: 'Ex: Cauteloso, impulsivo, melancólico...' },
        { name: 'forcas', label: 'Forças', placeholder: 'Ex: Inteligência, coragem, empatia...' },
        { name: 'fraquezas', label: 'Fraquezas', placeholder: 'Ex: Teimosia, medo de altura, ingenuidade...' },
        { name: 'motivacaoInterna', label: 'Motivação Interna', placeholder: 'Ex: Busca por autoaceitação, desejo de provar seu valor...' },
        { name: 'motivacaoExterna', label: 'Motivação Externa', placeholder: 'Ex: Proteger a família, ganhar uma recompensa...' },
        { name: 'motivacaoSocial', label: 'Motivação Social', placeholder: 'Ex: Lutar por justiça, mudar a sociedade...' },
    ];
    
    const cardColorClass = color === 'green' ? 'text-green-400' : 'text-red-400';
    const buttonColorClass = color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg space-y-4">
            <h3 className={`text-2xl font-bold mb-4 ${cardColorClass}`}>{title}</h3>
            {fields.map(field => (
                <div key={field.name}>
                    <label className="block text-sm font-bold text-gray-300 mb-1">{field.label}</label>
                    <textarea 
                        name={field.name}
                        value={characterData[field.name]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        rows="2"
                    />
                </div>
            ))}
            <button
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className={`w-full ${buttonColorClass} text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100 mt-4`}
            >
                {isLoading ? <LoaderCircle size={20} className="animate-spin mr-2" /> : <BrainCircuit size={20} className="mr-2" />}
                Gerar Resumo do Personagem
            </button>
            <div className="mt-4">
                <label className="block text-sm font-bold text-gray-300 mb-1">Resumo Gerado (Editável)</label>
                <textarea
                    name="summary"
                    value={characterData.summary}
                    onChange={handleInputChange}
                    placeholder="O resumo gerado pela IA aparecerá aqui..."
                    className="w-full bg-gray-900 p-3 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    rows="8"
                />
            </div>
        </div>
    );
};

// --- Sub-componente da Aba de Elementos da Narrativa ---
const NarrativeElementsTab = ({ argumentData, setArgumentData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const narrativeData = argumentData.narrativeElements;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedNarrativeElements = {
             ...argumentData.narrativeElements,
             [name]: value
        };
        setArgumentData({ ...argumentData, narrativeElements: updatedNarrativeElements });
    };

    const handleGenerateNarrative = async () => {
        setIsLoading(true);
        const {
            storyline, conceitoFundamental, temas, objetivoTrama, objetivoPersonagem,
            plotTwist, recursoNarrativo, objetosChave, lugaresImportantes, sentimentosPredominantes
        } = narrativeData;

        const prompt = `Crie um resumo narrativo em prosa para um filme, integrando de forma coesa os seguintes elementos:
        - Tema Principal Geral: ${argumentData.mainTheme || 'Não definido'}
        - Storyline: ${storyline || 'Não informado'}
        - Conceito Fundamental: ${conceitoFundamental || 'Não informado'}
        - Temas: ${temas || 'Não informado'}
        - Objetivo da Trama (Conflito Externo): ${objetivoTrama || 'Não informado'}
        - Objetivo do Personagem (Conflito Interno): ${objetivoPersonagem || 'Não informado'}
        - Plot Twist: ${plotTwist || 'Não informado'}
        - Recurso Narrativo Principal: ${recursoNarrativo || 'Não informado'}
        - Objetos Chave: ${objetosChave || 'Não informado'}
        - Lugares Importantes: ${lugaresImportantes || 'Não informado'}
        - Sentimentos Predominantes: ${sentimentosPredominantes || 'Não informado'}
        - Resumo do Protagonista: ${argumentData.characters.protagonist.summary || 'Não informado'}
        - Resumo do Antagonista: ${argumentData.characters.antagonist.summary || 'Não informado'}

        Construa um parágrafo fluído e envolvente que conecte esses pontos, formando a base de uma história. Responda apenas com o texto do resumo.`;

        const summary = await callGeminiApi(prompt);
        handleInputChange({ target: { name: 'summary', value: summary } });
        setIsLoading(false);
    };

    const fields = [
        { name: 'storyline', label: 'Storyline', placeholder: 'A jornada de X para alcançar Y, enfrentando Z.' },
        { name: 'conceitoFundamental', label: 'Conceito Fundamental', placeholder: 'A ideia central em uma frase. Ex: E se os sonhos pudessem ser invadidos?' },
        { name: 'temas', label: 'Temas', placeholder: 'Ex: Amor, perda, traição, redenção.' },
        { name: 'objetivoTrama', label: 'Objetivo da Trama (Conflito Ext.)', placeholder: 'Ex: Desarmar uma bomba, encontrar um tesouro.' },
        { name: 'objetivoPersonagem', label: 'Objetivo do Personagem (Conflito Int.)', placeholder: 'Ex: Superar um trauma, aprender a confiar.' },
        { name: 'plotTwist', label: 'Plot Twist', placeholder: 'A grande virada na história. Ex: O mentor é o verdadeiro vilão.' },
        { name: 'recursoNarrativo', label: 'Recurso Narrativo Principal', placeholder: 'Ex: Narração em off, flashbacks, linha do tempo não-linear.' },
        { name: 'objetosChave', label: 'Objetos Chave', placeholder: 'Itens importantes para a trama. Ex: Um mapa antigo, um diário, uma chave misteriosa.' },
        { name: 'lugaresImportantes', label: 'Lugares Importantes', placeholder: 'Locais onde eventos cruciais acontecem. Ex: Uma cabana abandonada, um castelo.' },
        { name: 'sentimentosPredominantes', label: 'Sentimentos Predominantes', placeholder: 'As principais emoções que a história evoca. Ex: Suspense, melancolia, alegria.' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-bold">Estruture Sua Narrativa</h2>
                <p className="text-gray-400 mt-2 mb-6">Defina os pilares da sua história. Quanto mais detalhes você fornecer, mais rico será o argumento gerado pela IA.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(field => (
                    <div key={field.name}>
                        <label className="block text-sm font-bold text-gray-300 mb-1">{field.label}</label>
                        <textarea
                            name={field.name}
                            value={narrativeData[field.name]}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            rows="2"
                        />
                    </div>
                ))}
            </div>
            <div className="pt-4">
                 <button
                    onClick={handleGenerateNarrative}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100"
                >
                    {isLoading ? <LoaderCircle size={20} className="animate-spin mr-2" /> : <BrainCircuit size={20} className="mr-2" />}
                    Gerar Narrativa
                </button>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-bold text-gray-300 mb-1">Resumo da Narrativa (Editável)</label>
                <textarea
                    name="summary"
                    value={narrativeData.summary}
                    onChange={handleInputChange}
                    placeholder="O resumo gerado pela IA, conectando todos os elementos, aparecerá aqui..."
                    className="w-full bg-gray-900 p-3 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    rows="10"
                />
            </div>
        </div>
    );
};

// --- Sub-componente da Aba de Argumento Consolidado ---
const ConsolidatedArgumentTab = ({ argumentData, setArgumentData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const consolidatedData = argumentData.consolidatedArgument;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setArgumentData({
            ...argumentData,
            consolidatedArgument: {
                ...argumentData.consolidatedArgument,
                [name]: value,
            }
        });
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        const { mainTheme, characters, narrativeElements } = argumentData;

        const prompt = `Com base na seguinte compilação de dados de um projeto de filme, gere três seções distintas: STORYLINE, SINOPSE e ARGUMENTO COMPLETO.

### DADOS DO PROJETO:
- **Tema Principal:** ${mainTheme || 'Não definido'}
- **Resumo do Protagonista:** ${characters.protagonist.summary || 'Não definido'}
- **Resumo do Antagonista:** ${characters.antagonist.summary || 'Não definido'}
- **Storyline Inicial:** ${narrativeElements.storyline || 'Não informado'}
- **Conceito Fundamental:** ${narrativeElements.conceitoFundamental || 'Não informado'}
- **Temas Secundários:** ${narrativeElements.temas || 'Não informado'}
- **Conflito Externo (Objetivo da Trama):** ${narrativeElements.objetivoTrama || 'Não informado'}
- **Conflito Interno (Objetivo do Personagem):** ${narrativeElements.objetivoPersonagem || 'Não informado'}
- **Plot Twist:** ${narrativeElements.plotTwist || 'Não informado'}
- **Recurso Narrativo:** ${narrativeElements.recursoNarrativo || 'Não informado'}
- **Objetos Chave:** ${narrativeElements.objetosChave || 'Não informado'}
- **Lugares Importantes:** ${narrativeElements.lugaresImportantes || 'Não informado'}
- **Sentimentos Predominantes:** ${narrativeElements.sentimentosPredominantes || 'Não informado'}

### INSTRUÇÕES DE GERAÇÃO:
1.  **[STORYLINE]**: Crie uma storyline de uma frase, concisa e impactante, que resuma a essência da história.
2.  **[SINOPSE]**: Escreva uma sinopse comercial de 3 a 5 parágrafos que desperte o interesse. Apresente o protagonista, seu mundo, o conflito principal e o que está em jogo, sem revelar o final.
3.  **[ARGUMENTO]**: Desenvolva um argumento detalhado de aproximadamente 800 a 1200 palavras, estruturado com um claro **INÍCIO**, **MEIO** e **FIM**. Descreva os principais pontos de virada, o desenvolvimento dos personagens e a resolução do conflito.

Use os marcadores [STORYLINE], [SINOPSE] e [ARGUMENTO] para separar claramente cada seção.`;

        const fullResponse = await callGeminiApi(prompt);

        const storylineMatch = fullResponse.match(/\[STORYLINE\]([\s\S]*?)(\[SINOPSE\]|$)/);
        const sinopseMatch = fullResponse.match(/\[SINOPSE\]([\s\S]*?)(\[ARGUMENTO\]|$)/);
        const argumentoMatch = fullResponse.match(/\[ARGUMENTO\]([\s\S]*)/);

        setArgumentData({
            ...argumentData,
            consolidatedArgument: {
                storyline: storylineMatch ? storylineMatch[1].trim() : "Não foi possível gerar a storyline.",
                sinopse: sinopseMatch ? sinopseMatch[1].trim() : "Não foi possível gerar a sinopse.",
                argumentoCompleto: argumentoMatch ? argumentoMatch[1].trim() : "Não foi possível gerar o argumento completo.",
            }
        });
        
        setIsLoading(false);
    };

    const handleSave = () => {
        alert("Argumento salvo com sucesso!");
    };
    
    const handleExport = () => {
        const { storyline, sinopse, argumentoCompleto } = consolidatedData;
        const textToExport = `STORYLINE\n=========\n${storyline}\n\n\nSINOPSE\n=======\n${sinopse}\n\n\nARGUMENTO COMPLETO\n===================\n${argumentoCompleto}`;
        
        const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `argumento_consolidado.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-bold">Consolide Sua História</h2>
                <p className="text-gray-400 mt-2 mb-6">Este é o passo final. A IA irá compilar todas as informações das abas anteriores para gerar a documentação principal do seu projeto. Clique no botão abaixo para começar.</p>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-lg text-center">
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center disabled:bg-gray-500 transition-all transform hover:scale-105 active:scale-100 mx-auto"
                >
                    {isLoading ? <LoaderCircle size={22} className="animate-spin mr-2" /> : <Wand2 size={22} className="mr-2" />}
                    Gerar Argumento Consolidado
                </button>
            </div>
            
            {isLoading && (
                 <div className="text-center p-8">
                    <LoaderCircle size={32} className="animate-spin mx-auto text-indigo-400" />
                    <p className="mt-4 text-gray-400">Compilando e gerando sua história... Isso pode levar um momento.</p>
                </div>
            )}

            {!isLoading && (consolidatedData.storyline || consolidatedData.sinopse || consolidatedData.argumentoCompleto) && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <label className="block text-lg font-bold text-indigo-300 mb-2">Storyline</label>
                        <textarea name="storyline" value={consolidatedData.storyline} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" rows="2" />
                    </div>
                     <div>
                        <label className="block text-lg font-bold text-indigo-300 mb-2">Sinopse</label>
                        <textarea name="sinopse" value={consolidatedData.sinopse} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" rows="8" />
                    </div>
                     <div>
                        <label className="block text-lg font-bold text-indigo-300 mb-2">Argumento Completo</label>
                        <textarea name="argumentoCompleto" value={consolidatedData.argumentoCompleto} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" rows="20" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all transform hover:scale-105 active:scale-100">
                           <Save size={18} className="mr-2"/> Salvar
                        </button>
                        <button onClick={handleExport} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all transform hover:scale-105 active:scale-100">
                           <Download size={18} className="mr-2"/> Exportar (.txt)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Módulo: Gerador de Pitching
const PitchingGenerator = ({ setCurrentPage, script }) => {
    const pitchingPoints = [
        "Sinopse", "Tema", "Formato", "Público-Alvo", "Justificativa", 
        "Tom e Estilo", "Arco da História", "Produtos Relacionados", 
        "Cronograma", "Estratégias de Lançamento", "Distribuição"
    ];

    const formatAIResponse = (text) => <p className="text-gray-300 whitespace-pre-wrap">{text}</p>;

    if (!script) {
        return (
            <div className="text-center animate-fade-in">
                <h2 className="text-2xl mb-4">Nenhum Roteiro Selecionado</h2>
                <p className="text-gray-400 mb-4">Por favor, selecione um roteiro em "Meus Projetos" para gerar o pitching.</p>
                <button onClick={() => setCurrentPage('projects')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Ir para Projetos</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerador de Pitching</h1>
                <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white">&larr; Voltar</button>
            </div>
            <div className="space-y-2">
                 {pitchingPoints.map(point => (
                     <Accordion 
                        key={point} 
                        title={point}
                        prompt={script.content ? `Para o roteiro a seguir, gere o conteúdo para a seção "${point}" de um Film Design Document. Seja objetivo e profissional. Não inclua detalhes de orçamento. Roteiro: ${script.content}` : null}
                    >
                        {(content) => formatAIResponse(content)}
                    </Accordion>
                ))}
            </div>
        </div>
    );
};

// Módulo: Página do Chat de IA
const ChatPage = ({ scriptContext, conversations, setConversations }) => {
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleNewConversation = () => {
        setActiveConversationId(null);
    };

    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
    };
    
    const handleDeleteConversation = (id) => {
        setConversations(conversations.filter(c => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
    };

    const handleSend = async () => {
        if(!input.trim() || isLoading) return;
        
        const userMessage = { role: 'user', text: input };
        setInput('');
        
        let currentConversation;
        let conversationId = activeConversationId;

        if (!conversationId) {
            // Cria uma nova conversa
            conversationId = Date.now();
            currentConversation = {
                id: conversationId,
                title: input.substring(0, 40) + (input.length > 40 ? '...' : ''),
                messages: [userMessage],
                context: scriptContext ? { name: scriptContext.name, type: scriptContext.type } : null
            };
            setConversations([currentConversation, ...conversations]);
            setActiveConversationId(conversationId);
        } else {
            // Adiciona a uma conversa existente
            currentConversation = conversations.find(c => c.id === conversationId);
            currentConversation.messages.push(userMessage);
            setConversations([...conversations]);
        }
        
        setIsLoading(true);

        const contextText = scriptContext
            ? `Use o seguinte roteiro como contexto: (Nome: ${scriptContext.name}): "${scriptContext.content}"`
            : 'Responda de forma geral, sem o contexto de um roteiro específico.';
        
        const prompt = `Como um consultor de roteiro especialista, responda à seguinte pergunta do usuário. ${contextText}
        
        Pergunta do usuário: "${input}"`;
        
        const response = await callGeminiApi(prompt);
        const aiMessage = { role: 'ia', text: response };

        // Atualiza a conversa correta com a resposta da IA
        setConversations(prevConvos => prevConvos.map(c => 
            c.id === conversationId 
                ? { ...c, messages: [...c.messages, aiMessage] }
                : c
        ));
        setIsLoading(false);
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
        <div className="animate-fade-in h-full flex">
            {/* Barra Lateral de Conversas */}
            <div className="w-1/3 max-w-xs bg-gray-800/50 p-4 rounded-l-lg flex flex-col">
                <button onClick={handleNewConversation} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center mb-4">
                    <Plus size={16} className="mr-2" /> Nova Conversa
                </button>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(convo => (
                        <div key={convo.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer mb-2 group ${activeConversationId === convo.id ? 'bg-indigo-500/50' : 'hover:bg-gray-700'}`} onClick={() => handleSelectConversation(convo.id)}>
                            <p className="truncate text-sm">{convo.title}</p>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(convo.id)}} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Janela Principal do Chat */}
            <div className="flex-1 flex flex-col bg-gray-800 rounded-r-lg">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Consultor IA</h2>
                    <p className="text-sm text-gray-400">{scriptContext ? `Contexto: ${scriptContext.name} (${scriptContext.type})` : "Modo Geral"}</p>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {activeConversation ? activeConversation.messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'ia' && <div className="bg-indigo-500 p-2 rounded-full flex-shrink-0"><Bot size={20} /></div>}
                            <div className={`p-3 rounded-lg max-w-lg animate-fade-in-fast ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-400">Selecione uma conversa ou inicie uma nova.</p>}
                     {isLoading && <div className="flex items-start gap-3"><div className="bg-indigo-500 p-2 rounded-full flex-shrink-0"><LoaderCircle className="animate-spin" /></div><div className="p-3 rounded-lg bg-gray-700"><p className="text-sm">Analisando...</p></div></div>}
                </div>
                <div className="p-2 border-t border-gray-700">
                    <div className="flex items-center bg-gray-700 p-2 rounded-lg">
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()} 
                            className="w-full bg-transparent p-2 focus:outline-none" 
                            placeholder={isLoading ? "Aguarde a resposta da IA..." : "Faça uma pergunta..."}
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-md disabled:bg-gray-500 transition-colors">
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente: Configurações
const SettingsPage = ({ setCurrentPage }) => {
    const [name, setName] = useState("Usuário de Exemplo");
    const [email, setEmail] = useState("usuario@email.com");

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        alert("Perfil atualizado com sucesso! (Simulação)");
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        if (data.newPassword !== data.confirmPassword) {
            alert("As novas senhas não coincidem.");
            return;
        }
        alert("Senha alterada com sucesso! (Simulação)");
        e.target.reset();
    };


    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Configurações de Perfil</h1>
                <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white">&larr; Voltar</button>
            </div>
            <div className="space-y-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-indigo-400">Informações Pessoais</h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Nome</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">E-mail</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                        </div>
                         <div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Salvar Alterações</button>
                        </div>
                    </form>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                     <h3 className="text-xl font-semibold mb-4 text-indigo-400">Alterar Senha</h3>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Senha Atual</label>
                            <input name="currentPassword" type="password" required className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Nova Senha</label>
                            <input name="newPassword" type="password" required className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1">Confirmar Nova Senha</label>
                            <input name="confirmPassword" type="password" required className="w-full bg-gray-700 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Alterar Senha</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const HelpAccordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 hover:bg-gray-700/50 transition-colors">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <ChevronDown size={24} className={`transition-transform transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700 text-gray-300 space-y-2 animate-fade-in-fast">
                    {children}
                </div>
            )}
        </div>
    );
};

// Componente: Ajuda
const HelpPage = ({ setCurrentPage }) => {
    const helpTopics = [
        {
            title: "Meus Projetos",
            content: "Esta é sua central de comando. Aqui você pode criar e gerenciar todos os seus projetos. Cada projeto funciona como uma pasta que guarda seus arquivos, como roteiros e argumentos. Use os botões para criar novos arquivos, fazer uploads de textos existentes e manter todo o seu trabalho organizado."
        },
        {
            title: "Análise de Narrativa",
            content: "Uma poderosa ferramenta de IA que lê seus roteiros e oferece uma análise aprofundada. Selecione um arquivo de roteiro e a IA irá avaliar sua estrutura narrativa (usando a Jornada do Herói), a dramaturgia, o desenvolvimento dos personagens e até o potencial de mercado da sua história. Ideal para obter insights valiosos e aprimorar sua escrita."
        },
        {
            title: "Editor de Roteiro",
            content: "Um editor de texto completo e focado na formatação profissional de roteiros (Master Scenes). Além das ferramentas de formatação rápida, você pode usar a IA para gerar novas cenas do zero ou para melhorar trechos de texto que você selecionar. É o ambiente perfeito para escrever e refinar suas ideias."
        },
        {
            title: "Gerador de Argumento",
            content: "Este módulo é um guia passo a passo para construir sua história do zero. Você passará por abas para definir temas, desenvolver personagens, estruturar os elementos narrativos e, no final, a IA consolida todas as suas ideias em um argumento completo, com storyline e sinopse profissionais."
        },
        {
            title: "Gerador de Pitching",
            content: "Transforme seu roteiro finalizado em um documento de pitching profissional. A IA analisa seu texto e gera automaticamente todas as seções-chave de um Film Design Document, como sinopse, público-alvo, tom e estilo, justificativa e muito mais. É a ferramenta perfeita para preparar seu projeto para o mercado."
        },
        {
            title: "Consultor IA",
            content: "Seu consultor de roteiro pessoal. Inicie uma conversa com a IA usando um de seus arquivos (roteiro ou argumento) como contexto. Peça ideias, discuta problemas na trama, explore novas possibilidades para seus personagens e receba sugestões criativas para destravar sua história."
        }
    ];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Central de Ajuda</h1>
                <button onClick={() => setCurrentPage('projects')} className="text-gray-400 hover:text-white">&larr; Voltar</button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">Como usar os Módulos</h2>
                {helpTopics.map(topic => (
                    <HelpAccordion key={topic.title} title={topic.title}>
                        <p>{topic.content}</p>
                    </HelpAccordion>
                ))}
            </div>
             <div className="bg-gray-800 p-6 rounded-lg mt-8">
                 <h3 className="text-xl font-semibold mb-3">Fale Conosco</h3>
                 <p className="text-gray-300">Encontrou um problema ou tem uma sugestão? Envie um e-mail para <a href="mailto:atendimento@cmkfilmes.com" className="text-indigo-400 hover:underline">atendimento@cmkfilmes.com</a>.</p>
             </div>
        </div>
    );
};

export default App;