import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList, Eye, FileText, Folder, FolderOpen, Import, Layers, ListPlus, Map, Maximize, Pencil, RefreshCw, Search, SquareSplitHorizontal, Trash2, Upload, X } from 'lucide-react';
import type { AppApi } from '../types';
import { canRead, projectOptions, resolveProject } from '../services/demo';
import { Modal } from '../components/Modal';
import { MapView } from '../components/MapView';
import { RESULT_DIRECTORIES, REMOTE_FILES, WELL_FILES, bytesLabel, initialResultInfo, resultFilesCache, resultInfoCache, saveProjectInfo, saveDirectoryFiles, importProjectInformation, appendUploadedFiles, removeFiles } from '../services/results';
import type { ResultFile, ResultInfo } from '../services/results';
import { useResultColumns } from '../hooks/useResultColumns';
import './ResultsPage.css';
type Dialog = 'edit' | 'import' | 'local' | 'remote' | 'delete' | 'file' | 'fields' | null;
const tabs = [{ id: 'overview', label: '成果概览', Icon: FileText }, { id: 'gis', label: '综合成图', Icon: Map }, { id: 'doc', label: '设计文档.doc', Icon: FileText }, { id: 'las', label: 'B1-1.las', Icon: FileText }, { id: 'report', label: '设计文档.doc', Icon: FileText }];
const infoLabels: [
    string,
    string
][] = [['name', '项目名称'], ['basin', '所属盆地'], ['areaName', '所属工区'], ['depression', '坳陷'], ['concavity', '凹陷'], ['location', '工区位置'], ['area', '工区面积（km²）'], ['client', '甲方'], ['contractor', '承包商'], ['start', '起始日期'], ['end', '结束日期'], ['year', '年度']];
function value(v: string) { return v || '—'; }
function InfoTable({ data, fields }: {
    data: Record<string, string>;
    fields: [
        string,
        string
    ][];
}) { return <div className="result-facts">{fields.map(([key, label]) => <div key={key} className={key === 'name' || key === 'year' ? 'span-two' : ''}><dt>{label}</dt><dd>{value(data[key])}</dd></div>)}</div>; }
function Information({ info, onEdit, onImport, blank }: {
    info: ResultInfo;
    onEdit: () => void;
    onImport: () => void;
    blank: boolean;
}) { return <><header className="information-heading"><h1>项目信息</h1><div><button className="button small" onClick={onImport}><Import size={16}/>导入</button><button className="button small" onClick={onEdit}><Pencil size={16}/>编辑</button></div></header><section className="card information-card"><h2><ClipboardList size={20}/>基本信息</h2><InfoTable data={info} fields={infoLabels}/></section><section className="card information-card"><h2><ClipboardList size={20}/>地震数据信息</h2><InfoTable data={{ name: '', domain: '', dimension: '', size: blank ? '' : '3.65', sample: '' }} fields={[['name', '数据名'], ['domain', '数据域类型'], ['dimension', '地震数据维度'], ['size', '数据大小（GB）'], ['sample', '线道间隔/采样率（ms）']]}/></section><section className="card information-card"><h2><ClipboardList size={20}/>SGY道头信息</h2><div className="result-sgy">{[['iline', '189'], ['xline', '21'], ['xloc', '181'], ['istep', '1'], ['xstep', '1'], ['yloc', '185']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{blank ? '—' : v}</dd></div>)}</div></section><section className="card information-card"><h2><ClipboardList size={20}/>地质体类型</h2><div className="result-geology">{[['正断层', '有'], ['逆断层', '有'], ['走滑断层', '无'], ['潜山', '无'], ['河道', '有'], ['溶洞', '无'], ['坡体', '有'], ['盐丘', '无'], ['侵入体', '无'], ['不整合面', '有']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{blank ? '—' : v}</dd></div>)}</div></section><div className="information-pair"><section className="card information-card"><h2><ClipboardList size={20}/>构造成果数据</h2><InfoTable data={{ layers: blank ? '' : '9', faults: blank ? '' : '135' }} fields={[['layers', '层位（个）'], ['faults', '断层（条）']]}/></section><section className="card information-card"><h2><ClipboardList size={20}/>测井数据</h2><InfoTable data={{ wells: blank ? '' : '18', curves: blank ? '' : '18', time: blank ? '' : '有' }} fields={[['wells', '井数'], ['curves', '测井曲线'], ['time', '是否有时深关系']]}/></section></div><section className="card information-card"><h2><ClipboardList size={20}/>备注</h2><p className="project-note">{value(info.note)}</p></section></>; }
function OverviewContent({ info, blank, onDirectory }: {
    info: ResultInfo;
    blank: boolean;
    onDirectory: (n: string) => void;
}) { return <div className="result-overview"><h2>成果概览</h2><div className="overview-summary"><div><span>工区位置</span><strong>{value(info.location)}</strong></div><div><span>工区面积（km²）</span><strong>{value(info.area)}</strong></div><div><span>数据资产总量</span><strong>{blank ? '0 项 / 0 B' : '0 项 / 0 B'}</strong></div><div><span>项目周期</span><strong>{info.start ? info.start + ' 至 ' + info.end : '—'}</strong></div><span className="badge warning">未归档 ›</span></div><h3><ClipboardList size={20}/>数据资产详情</h3><div className="result-assets">{['井筒数据成果', '处理数据', '解释成果', '反演与建模成果', '成图成果', '文档成果'].map((n, i) => <button key={n} className="card" onClick={() => onDirectory(['测井数据', '偏移叠加纯波数据', '层位', '叠后反演结果', '地层厚度图', '项目设计文档'][i])}><span>{n}</span><strong>0 项 / 0</strong></button>)}</div><h3><RefreshCw size={18}/>最近上传</h3>{blank ? <div className="empty-state">暂无上传记录</div> : <div className="recent-files">{['安13北-验收附图册.ppt', '安13北_验收文字报告.pdf', 'QinShui_A13N_DSM_Tg.GDB', 'QinShui_A13N_DSM_T8.GDB'].map((n, i) => <div key={n}><FileText size={22}/><span><strong>{n}</strong><small>超级管理员　2026-09-29 09:52:45</small></span><b>{['52.31 MB', '33.49 MB', '1.98 MB', '2.04 MB'][i]}</b></div>)}</div>}</div>; }
export default function ResultsPage({ api }: {
    api: AppApi;
}) {
    const { state, setState } = api;
    const project = resolveProject(state) || projectOptions(state)[0];
    const id = project?.id || 'current';
    const blank = id.startsWith('created-');
    const [info, setInfo] = useState<ResultInfo>(project ? resultInfoCache[id] || initialResultInfo(project) : initialResultInfo({ id: '', name: '', basin: '', area: '', year: '', type: '', readable: false, archived: false, point: [0, 0] }));
    const [directory, setDirectory] = useState(state.route.section === 'wells' ? '测井数据' : '项目信息');
    const layoutMode = directory === '项目信息' && state.rightMaximized ? 'right' : directory === '项目信息' && state.informationMaximized ? 'information' : 'split';
    const columns = useResultColumns(layoutMode, directory === '项目信息');
    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [projectQuery, setProjectQuery] = useState('');
    const [closedTabs, setClosedTabs] = useState<string[]>([]);
    const [dialog, setDialog] = useState<Dialog>(null);
    const [draft, setDraft] = useState(info);
    const [formError, setFormError] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [remoteSource, setRemoteSource] = useState('');
    const [directoryQuery, setDirectoryQuery] = useState('');
    const [remoteDirectory, setRemoteDirectory] = useState('');
    const [remoteQuery, setRemoteQuery] = useState('');
    const [remoteChosen, setRemoteChosen] = useState<string[]>([]);
    const [remoteExpanded, setRemoteExpanded] = useState(true);
    const [fileRows, setFileRows] = useState<ResultFile[]>(resultFilesCache[id] || (blank ? [] : WELL_FILES));
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [activeFile, setActiveFile] = useState<ResultFile | null>(null);
    const [deleteIds, setDeleteIds] = useState<string[]>([]);
    const [dataPanelCollapsed, setDataPanelCollapsed] = useState(false);
    const [mapZoom, setMapZoom] = useState(1);
    const infoRef = useRef<HTMLElement>(null), rightRef = useRef<HTMLDivElement>(null);
    const scrollPositions = useRef({ info: 0, right: 0 });
    const maximizedScrollPositions = useRef<{ info: number | null; right: number | null }>({ info: null, right: null });
    const section = state.route.section;
    useEffect(() => { if (project) {
        setInfo(resultInfoCache[id] || initialResultInfo(project));
        setFileRows(resultFilesCache[id] || (blank ? [] : WELL_FILES));
        setSelectedFiles([]);
        setDialog(null);
    } }, [id]);
    useEffect(() => { if (section === 'wells')
        setDirectory('测井数据');
    else if (section && RESULT_DIRECTORIES.some(g => g.items.includes(section)))
        setDirectory(section);
    else
        setDirectory('项目信息'); }, [section]);
    useEffect(() => { const click = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.result-project-selector'))
        setSelectorOpen(false); if (!(e.target as HTMLElement).closest('.file-upload-dropdown'))
        setMenuOpen(false); }; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        setSelectorOpen(false);
        setMenuOpen(false);
    } }; document.addEventListener('click', click); document.addEventListener('keydown', key); return () => { document.removeEventListener('click', click); document.removeEventListener('keydown', key); }; }, []);
    useEffect(() => { requestAnimationFrame(() => {
        if (infoRef.current && !state.rightMaximized)
            infoRef.current.scrollTop = (state.informationMaximized ? maximizedScrollPositions.current.info : null) ?? scrollPositions.current.info;
        if (rightRef.current && !state.informationMaximized)
            rightRef.current.scrollTop = (state.rightMaximized ? maximizedScrollPositions.current.right : null) ?? scrollPositions.current.right;
    }); }, [state.rightMaximized, state.informationMaximized]);
    if (!project || !canRead(project, state.role))
        return <div className="results-denied empty-state"><Folder size={44}/><h2>您无浏览此项目数据的权限</h2><button className="button primary" onClick={() => api.navigate({ page: 'overview' })}>返回概览</button></div>;
    const selectDirectory = (n: string) => { setDirectory(n); setMenuOpen(false); setState(s => ({ ...s, route: { ...s.route, section: n === '测井数据' ? 'wells' : n === '项目信息' ? undefined : n } })); api.navigate({ page: 'results', projectId: id, section: n === '测井数据' ? 'wells' : n === '项目信息' ? undefined : n }); };
    const openDialog = (d: Dialog) => { setDialog(d); setSelectorOpen(false); setMenuOpen(false); setFormError(''); if (d === 'edit')
        setDraft({ ...info }); if (d === 'local')
        setLocalFile(null); if (d === 'remote') {
        setRemoteSource('');
        setRemoteDirectory('');
        setRemoteQuery('');
        setDirectoryQuery('');
        setRemoteChosen([]);
    } };
    const saveInfo = (next: ResultInfo) => { setInfo(saveProjectInfo(id,next)); setState(s => ({ ...s, projects: [...s.projects.filter(p => p.id !== id), { ...project, name: next.name, basin: next.basin, year: next.year, area: next.area }] })); setDialog(null); };
    const editSave = () => { if (!draft.name.trim()) {
        setFormError('请输入项目名称');
        return;
    } if (draft.start && draft.end && draft.start > draft.end) {
        setFormError('结束日期不能早于起始日期');
        return;
    } saveInfo({ ...draft, name: draft.name.trim() }); api.notify('项目信息已保存'); };
    const importFile = (file?: File) => { if (!file)
        return; if (!/\.xlsx?$/i.test(file.name)) {
        setFormError('请选择 Excel 文件（.xls 或 .xlsx）');
        return;
    } saveInfo(importProjectInformation(info)); api.notify('Excel 文件已选择，演示信息已自动回填'); };
    const currentFiles = fileRows.filter(f => f.directory === directory);
    const allSelected = currentFiles.length > 0 && currentFiles.every(f => selectedFiles.includes(f.id));
    const setFiles = (next: ResultFile[]) => { setFileRows(saveDirectoryFiles(id,next)); };
    const addFiles = (files: ResultFile[]) => { setFiles(appendUploadedFiles(fileRows,files,directory)); setDialog(null); api.notify('文件已加入当前成果目录（本地演示）'); };
    const uploadLocal = () => { if (localFile)
        addFiles([{ id: '', name: localFile.name, format: localFile.name.split('.').at(-1) || '', size: bytesLabel(localFile.size), uploaded: '', user: '', directory }]); };
    const deleteFiles = () => { setFiles(removeFiles(fileRows,deleteIds)); setSelectedFiles(x => x.filter(id => !deleteIds.includes(id))); setDialog(null); api.notify('已删除所选文件'); };
    const rememberScroll = () => {
        if (!state.rightMaximized && infoRef.current)
            (state.informationMaximized ? maximizedScrollPositions : scrollPositions).current.info = infoRef.current.scrollTop;
        if (!state.informationMaximized && rightRef.current)
            (state.rightMaximized ? maximizedScrollPositions : scrollPositions).current.right = rightRef.current.scrollTop;
    };
    const maximize = () => {
        rememberScroll();
        setState(s => ({ ...s, rightMaximized: !s.rightMaximized, informationMaximized: false }));
    };
    const cycleLayout = () => {
        rememberScroll();
        setState(s => ({ ...s,
            rightMaximized: !s.rightMaximized && !s.informationMaximized,
            informationMaximized: s.rightMaximized
        }));
    };
    const nextLayout = state.informationMaximized ? '恢复默认分屏' : state.rightMaximized ? '最大化项目信息' : '最大化右侧内容';
    const tab = state.resultTab;
    const activeTabs = tabs.filter(t => !closedTabs.includes(t.id));
    const directoryPath = RESULT_DIRECTORIES.find(g => g.items.includes(directory))?.name + ' / ' + directory;
    const visibleRemote = remoteSource && remoteDirectory ? REMOTE_FILES.filter(f => f.name.toLowerCase().includes(remoteQuery.toLowerCase())) : [];
    return <div ref={columns.containerRef} style={columns.style} className={'results-layout layout-' + layoutMode + (columns.resizing ? ' is-resizing' : '')}>
        <div className={'results-toolbar' + (directory === '项目信息' ? state.informationMaximized ? ' information-maximized' : state.rightMaximized ? ' right-maximized' : '' : ' without-result-tabs')}>
            <div className="result-project-tools"><div className="result-project-selector"><button className="project-trigger" title={project.name} aria-haspopup="listbox" aria-expanded={selectorOpen} onClick={() => setSelectorOpen(!selectorOpen)}><Search size={19}/><span>{project.name}</span><ChevronDown size={16}/></button>{selectorOpen && <div className="result-project-options"><label><Search size={17}/><input autoFocus aria-label="筛选项目" value={projectQuery} onChange={e => setProjectQuery(e.target.value)} placeholder="搜索项目名称、盆地或年度…"/></label><div role="listbox" aria-label="项目">{projectOptions(state).filter(p => [p.name, p.basin, p.year].join(' ').toLowerCase().includes(projectQuery.toLowerCase())).map(p => <button role="option" aria-selected={p.id === id} key={p.id} onClick={() => { setSelectorOpen(false); if (!canRead(p, state.role)) {
        api.deny();
        return;
    } setState(s => ({ ...s, currentProjectId: p.id, rightMaximized: false, informationMaximized: false })); api.navigate({ page: 'results', projectId: p.id }); }}><strong>{p.name}</strong><small>{p.year}　{p.basin}　{p.type}</small></button>)}</div></div>}</div><button className="button primary result-upload-primary" onClick={() => api.notify('已选择上传成果入口')}><Upload size={18}/>上传成果</button></div>
            {directory === '项目信息' && <div className="result-tabbar"><div className="result-tabs" style={{ display: state.informationMaximized ? 'none' : undefined }}>{activeTabs.map(t => <div className={'result-tab' + (tab === t.id ? ' active' : '')} key={t.id}><button onClick={() => setState(s => ({ ...s, resultTab: t.id }))}><t.Icon size={18}/>{t.label}</button>{!['overview', 'gis'].includes(t.id) && <button className="tab-close" aria-label={'关闭' + t.label} onClick={() => { setClosedTabs(x => [...x, t.id]); if (tab === t.id)
        setState(s => ({ ...s, resultTab: 'overview' })); }}><X size={13}/></button>}</div>)}</div><div className="result-view-actions"><button className="icon-button" title={state.rightMaximized ? '还原' : '最大化当前右侧栏目'} aria-label={state.rightMaximized ? '还原' : '最大化当前右侧栏目'} onClick={maximize}><Maximize size={19}/></button><button className="icon-button result-layout-toggle" title={nextLayout} aria-label={nextLayout} onClick={cycleLayout}><SquareSplitHorizontal size={19}/>{state.informationMaximized && <span className="result-tab-count" aria-label={'已打开' + activeTabs.length + '个页签'}>{activeTabs.length}</span>}</button></div></div>}
        </div><div className="results-body"><aside className="results-directory"><h2>成果目录</h2><nav aria-label="成果目录">{RESULT_DIRECTORIES.map(g => { const collapse = collapsedGroups.includes(g.name), Icon = g.icon === 'map' ? Map : g.icon === 'layers' ? Layers : g.icon === 'file' ? FileText : g.icon === 'well' ? ClipboardList : Folder; return <section key={g.name}><button className="directory-group" onClick={() => setCollapsedGroups(s => collapse ? s.filter(x => x !== g.name) : [...s, g.name])} aria-expanded={!collapse}>{collapse ? <ChevronRight size={13}/> : <ChevronDown size={13}/>}<Icon size={17}/><strong>{g.name}</strong>{g.count && <small>{g.count}</small>}</button>{!collapse && g.items.map((n, i) => <button className={'directory-leaf' + (directory === n ? ' active' : '')} key={n} onClick={() => selectDirectory(n)}>{g.name !== '基本信息' && <i className={'status-dot ' + (g.name === '井筒数据' ? (i < 2 ? 'pending' : i < 4 ? 'ready' : 'neutral') : g.name === '综合成图' && i === 0 ? 'ready' : 'neutral')}/>}<span>{n}</span></button>)}</section>; })}</nav><footer><span><i className="status-dot ready"/>已录入 3</span><span><i className="status-dot pending"/>未录入 2</span><span><i className="status-dot neutral"/>无需录入 26</span></footer></aside>
 {directory === '项目信息' ? <div className={'results-workspace' + (state.rightMaximized ? ' right-maximized' : state.informationMaximized ? ' information-maximized' : '')}><section ref={infoRef} className="results-information" style={{ display: state.rightMaximized ? 'none' : undefined }}><Information info={info} blank={blank} onEdit={() => openDialog('edit')} onImport={() => openDialog('import')}/></section><section className="results-right"><div ref={rightRef} className="result-right-content">{tab === 'overview' ? <OverviewContent info={info} blank={blank} onDirectory={selectDirectory}/> : tab === 'gis' ? <div className="result-gis"><MapView projects={[project]} selectedId={project.id} zoom={mapZoom} collapsed={dataPanelCollapsed} kind="data" onToggle={() => setDataPanelCollapsed(!dataPanelCollapsed)} onRefresh={() => setMapZoom(1)} onZoom={setMapZoom}/></div> : tab === 'las' ? <div className="result-document"><h2>B1-1.las</h2><h3>测井数据</h3><pre>{'~Version Information\nVERS.  2.0\nWRAP.  NO\n\n~Well Information\nWELL.  B1-1\n\n~Curve Information\nDEPT.M\nGR.API\nRHOB.G/C3'}</pre></div> : <div className="result-document"><FileText size={42}/><h2>设计文档.doc</h2><p>项目：{project.name}</p><p className="muted">文档预览</p><section className="card"><h3>项目基本信息</h3><InfoTable data={info} fields={infoLabels.slice(0, 7)}/></section></div>}</div></section></div> : directory === '关联项目' ? <section className="results-related"><h1>关联项目</h1><div className="empty-state"><Folder size={42}/><h3>暂无关联项目</h3></div></section> : <section className="results-file-content"><header className="files-heading"><h1>{directory}</h1><span className="badge">{currentFiles.length}个文件</span><div className="files-actions"><button className="button danger-primary" disabled={!selectedFiles.length} onClick={() => { setDeleteIds(selectedFiles); openDialog('delete'); }}>删除</button><button className="button" onClick={() => setSelectedFiles([])}>取消</button><div className="file-upload-dropdown"><button className="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Upload size={17}/>上传文件<ChevronDown size={15}/></button>{menuOpen && <div className="file-upload-menu"><button onClick={() => openDialog('local')}><Upload size={17}/>本地上传</button><button onClick={() => openDialog('remote')}><Folder size={17}/>远程上传</button></div>}</div></div></header><div className="table-wrap"><table className="result-files-table"><thead><tr><th><input type="checkbox" aria-label="全选文件" checked={allSelected} onChange={e => setSelectedFiles(e.target.checked ? currentFiles.map(f => f.id) : [])}/></th><th>序号</th><th>文件名</th><th>格式</th><th>大小</th><th>上传时间</th><th>上传人</th><th>状态</th><th>操作</th></tr></thead><tbody>{currentFiles.map((f, i) => <tr key={f.id}><td><input type="checkbox" aria-label={'选择' + f.name} checked={selectedFiles.includes(f.id)} onChange={e => setSelectedFiles(x => e.target.checked ? [...x, f.id] : x.filter(id => id !== f.id))}/></td><td>{i + 1}</td><td><button className="file-name" onClick={() => { setActiveFile(f); openDialog('file'); }}><FileText size={19}/>{f.name}</button></td><td>{f.format}</td><td>{f.size}</td><td>{f.uploaded}</td><td>{f.user}</td><td><span className="badge success">• 上传完成</span></td><td><div className="row-actions"><button className="icon-button" title="查看" aria-label={'查看' + f.name} onClick={() => { setActiveFile(f); openDialog('file'); }}><Eye size={18}/></button><button className="icon-button" title="扩展字段" aria-label={'扩展字段' + f.name} onClick={() => { setActiveFile(f); openDialog('fields'); }}><ListPlus size={18}/></button><button className="icon-button danger" title="删除" aria-label={'删除' + f.name} onClick={() => { setDeleteIds([f.id]); openDialog('delete'); }}><Trash2 size={18}/></button></div></td></tr>)}</tbody></table>{!currentFiles.length && <div className="empty-state"><FolderOpen size={44}/><h3>暂无文件</h3><p>上传后可在当前成果目录查看</p><button className="button primary" onClick={() => openDialog('local')}>上传文件</button></div>}</div></section>}
 </div>
 {directory === '项目信息' && <><div {...columns.separatorProps('directory')}/>{layoutMode === 'split' && <div {...columns.separatorProps('information')}/>}</>}
 {dialog === 'edit' && <Modal title="编辑项目信息" wide onClose={() => setDialog(null)} footer={<><button className="button" onClick={() => setDialog(null)}>取消</button><button className="button primary" onClick={editSave}>保存</button></>}><div className="form-grid result-edit-form">{infoLabels.map(([key, label]) => <label key={key} className={'field' + (key === 'name' ? ' full' : '')}>{label}{key === 'name' && <span className="required"> *</span>}{['basin', 'areaName', 'depression', 'concavity', 'client', 'contractor'].includes(key) ? <select value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}><option value="">请选择</option>{(key === 'basin' ? ['沁水盆地', '鄂尔多斯盆地', '四川盆地', '渤海湾盆地', '准噶尔盆地', '松辽盆地'] : key === 'client' ? ['浙江油田', '胜利油田'] : key === 'contractor' ? ['北京市海天吉佳科技公司', '东方地球物理公司西南物探分公司'] : key === 'depression' ? ['东部坳陷', '北部坳陷'] : key === 'concavity' ? ['田东凹陷', '福山凹陷'] : ['大安区块', '川南低陡褶带南缘太阳工区']).map(n => <option key={n}>{n}</option>)}</select> : <input value={draft[key]} placeholder="请输入" type={key === 'start' || key === 'end' ? 'date' : key === 'area' || key === 'year' ? 'number' : 'text'} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/>}</label>)}<label className="field full">备注<textarea value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}/></label></div>{formError && <p className="form-error" role="alert">{formError}</p>}</Modal>}
 {dialog === 'import' && <Modal title="导入项目信息" onClose={() => setDialog(null)} footer={<button className="button" onClick={() => setDialog(null)}>取消</button>}><p>选择 Excel 文件，自动导入当前项目的基本信息。</p><label className="result-file-picker"><Import size={30}/><strong>选择 Excel 文件</strong><input type="file" accept=".xls,.xlsx" aria-label="选择Excel文件" onChange={e => importFile(e.target.files?.[0])}/></label><p className="muted">文件选择后自动回填预设演示信息。</p>{formError && <p className="form-error" role="alert">{formError}</p>}</Modal>}
 {dialog === 'local' && <Modal title="本地上传" onClose={() => setDialog(null)} footer={<><button className="button" onClick={() => setDialog(null)}>取消</button><button className="button primary" disabled={!localFile} onClick={uploadLocal}>上传</button></>}><div className="upload-context"><p>当前项目　<strong>{project.name}</strong></p><p>成果目录　<strong>{directoryPath}</strong></p></div><label className="result-file-picker"><Upload size={30}/><strong>选择本地文件上传至当前成果目录</strong><input type="file" aria-label="选择本地文件" onChange={e => setLocalFile(e.target.files?.[0] || null)}/></label><h3>待上传文件</h3><table className="upload-files"><thead><tr><th>文件名</th><th>大小</th><th>状态</th></tr></thead><tbody>{localFile ? <tr><td>{localFile.name}</td><td>{bytesLabel(localFile.size)}</td><td>待上传</td></tr> : <tr><td colSpan={3} className="muted">尚未选择文件</td></tr>}</tbody></table></Modal>}
 {dialog === 'remote' && <Modal title="远程上传" wide onClose={() => setDialog(null)} footer={<><button className="button" onClick={() => setDialog(null)}>取消</button><button className="button primary" disabled={!remoteChosen.length} onClick={() => addFiles(REMOTE_FILES.filter(f => remoteChosen.includes(f.id)))}>上传</button></>}><div className="upload-context"><p>当前项目　<strong>{project.name}</strong></p><p>成果目录　<strong>{directoryPath}</strong></p></div><div className="remote-source"><label className="field">数据来源<select value={remoteSource} onChange={e => { setRemoteSource(e.target.value); setRemoteDirectory(''); setRemoteChosen([]); }}><option value="">请选择远程挂载数据</option><option>57服务器-华北-解释项目</option><option>57服务器-处理中心-处理项目</option></select></label><button className="button" onClick={() => { setDialog(null); api.navigate({ page: 'baseline', section: 'disks' }); }}>管理</button></div><div className="remote-panels"><section className="remote-directories"><header><h3>目录</h3><small>{remoteSource ? '1 个' : '0 个'}</small></header><input aria-label="搜索目录" placeholder="搜索目录…" value={directoryQuery} onChange={e => setDirectoryQuery(e.target.value)}/>{remoteSource && !directoryQuery || remoteSource && '测井数据'.includes(directoryQuery) ? <div className="remote-tree"><button onClick={() => setRemoteExpanded(!remoteExpanded)}>{remoteExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<Folder size={17}/>{remoteSource.includes('华北') ? 'diyan_huabei' : 'chulizhongxin'}</button>{remoteExpanded && <button className={remoteDirectory ? 'active' : ''} onClick={() => { setRemoteDirectory('测井数据'); setRemoteChosen([]); }}><FolderOpen size={17}/>测井数据</button>}</div> : <p className="remote-empty">暂无目录</p>}</section><section className="remote-file-list"><header><h3>文件列表</h3><small>{visibleRemote.length} 项</small><button className="icon-button" title="刷新文件列表" aria-label="刷新文件列表" onClick={() => api.notify('远程演示文件列表已刷新')}><RefreshCw size={18}/></button></header><div className="remote-file-search"><input aria-label="搜索文件名" placeholder="搜索文件名…" value={remoteQuery} onChange={e => setRemoteQuery(e.target.value)}/><button className="button small" onClick={() => setRemoteChosen([])}>取消选择</button></div><table className="upload-files"><thead><tr><th></th><th>文件名</th><th>大小</th><th>修改时间</th></tr></thead><tbody>{visibleRemote.map(f => <tr key={f.id}><td><input type="checkbox" aria-label={'选择远程' + f.name} checked={remoteChosen.includes(f.id)} onChange={e => setRemoteChosen(s => e.target.checked ? [...s, f.id] : s.filter(id => id !== f.id))}/></td><td>{f.name}</td><td>{f.size}</td><td>{f.uploaded}</td></tr>)}</tbody></table>{!visibleRemote.length && <p className="remote-empty">暂无文件</p>}</section></div><section className="remote-selected"><header><h3>已选文件 <span>{remoteChosen.length}</span></h3><button className="link-button" onClick={() => setRemoteChosen([])}>清空</button></header>{remoteChosen.length ? REMOTE_FILES.filter(f => remoteChosen.includes(f.id)).map(f => <span key={f.id}>{f.name}<button aria-label={'取消' + f.name} onClick={() => setRemoteChosen(x => x.filter(id => id !== f.id))}><X size={14}/></button></span>) : <p className="muted">尚未选择文件</p>}</section></Modal>}
 {dialog === 'delete' && <Modal title="删除文件" onClose={() => setDialog(null)} footer={<><button className="button" onClick={() => setDialog(null)}>取消</button><button className="button danger-primary" onClick={deleteFiles}>确认删除</button></>}><p>确定删除{deleteIds.length === 1 ? '文件“' + fileRows.find(f => f.id === deleteIds[0])?.name + '”' : '已选的 ' + deleteIds.length + ' 个文件'}吗？</p></Modal>}
 {(dialog === 'file' || dialog === 'fields') && activeFile && <Modal title={dialog === 'file' ? '查看文件' : '扩展字段'} onClose={() => setDialog(null)} footer={<button className="button" onClick={() => setDialog(null)}>关闭</button>}><InfoTable data={{ name: activeFile.name, format: activeFile.format, size: activeFile.size, date: activeFile.uploaded, user: activeFile.user }} fields={[['name', '文件名'], ['format', '格式'], ['size', '大小'], ['date', '上传时间'], ['user', '上传人']]}/>{dialog === 'fields' && <div className="empty-state result-extra-fields"><p>暂无扩展字段</p></div>}{dialog === 'file' && <p className="muted">文件内容未连接远程服务。</p>}</Modal>}
 </div>;
}
