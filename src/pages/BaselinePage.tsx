import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Eye, FileText, FolderTree, Grid2X2, HardDrive, Image, Layers, MapPinned, Pencil, Plus, ScanLine, Server, Trash2, Users } from 'lucide-react';
import type { AppApi } from '../types';
import { Modal } from '../components/Modal';
import { BASELINE_CONFIGS, NAMING_GROUPS, baselineFilter, demoRows, namingCache, saveBaselineRows } from '../services/baseline';
import type { BaselineRow } from '../services/baseline';
import './BaselinePage.css';
const icons = [Grid2X2, FileText, FolderTree, MapPinned, Layers, Image, Grid2X2, Layers, Layers, Layers, Users, Users, Users, HardDrive, Server];
type Dialog = {
    mode: 'new' | 'edit' | 'detail' | 'delete' | 'scan';
    row: BaselineRow;
};
export default function BaselinePage({ api }: {
    api: AppApi;
}) {
    const section = api.state.route.section || 'types';
    const config = BASELINE_CONFIGS.find(c => c.id === section || c.title === section) || BASELINE_CONFIGS[0];
    const [rows, setRows] = useState(demoRows[config.id]);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState('');
    const [codeDraft, setCodeDraft] = useState('');
    const [codeQuery, setCodeQuery] = useState('');
    const [extra, setExtra] = useState('');
    const [extraQuery, setExtraQuery] = useState('');
    const [expanded, setExpanded] = useState<string[]>(['1', '2', '5', '7', '10', '11', '15', '18']);
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [form, setForm] = useState<BaselineRow>({ id: '', name: '' });
    const [error, setError] = useState('');
    const [rangeCount, setRangeCount] = useState(1);
    const [names, setNames] = useState({ ...namingCache });
    useEffect(() => { setRows(demoRows[config.id]); setDraft(''); setQuery(''); setCodeDraft(''); setCodeQuery(''); setExtra(''); setExtraQuery(''); setDialog(null); setExpanded(config.id === 'types' ? ['1'] : ['1', '2', '5', '7', '10', '11', '15', '18']); }, [config.id]);
    const update = (next: BaselineRow[]) => { setRows(saveBaselineRows(config.id,next)); };
    const filtered = baselineFilter(rows, query, codeQuery, config.tree).filter(r => !extraQuery || Object.values(r).includes(extraQuery));
    const visible = filtered.filter(r => { if (query || codeQuery)
        return true; let parent = r.parent; while (parent) {
        if (!expanded.includes(parent))
            return false;
        parent = rows.find(x => x.id === parent)?.parent;
    } return true; });
    const open = (mode: Dialog['mode'], row?: BaselineRow, parent?: BaselineRow) => { const initial = row ? { ...row } : { id: 'new-' + Date.now(), name: '', ...(config.id === 'types' ? { color: '#277DA8' } : {}), ...(parent ? { parent: parent.id, level: (parent.level || 1) + 1, type: parent.level === 1 ? '坳陷' : '凹陷' } : config.tree ? { level: 1, type: '盆地' } : {}) }; setForm(initial); setDialog({ mode, row: initial }); setError(''); setRangeCount(1); };
    const close = () => setDialog(null);
    const save = () => { if (!form.name.trim()) {
        setError('请输入名称');
        return;
    } if (config.id === 'types' && !/^#[0-9a-f]{6}$/i.test(String(form.color || ''))) {
        setError('请输入有效的六位颜色值');
        return;
    } const saved = { ...form, name: form.name.trim(), ...(config.id === 'types' ? { level: form.parent ? 2 : 1 } : {}) }; update(dialog?.mode === 'edit' ? rows.map(r => r.id === saved.id ? saved : r) : [...rows, saved]); close(); api.notify('已保存到本地演示数据'); };
    const remove = () => { const ids = new Set([form.id]); let previous = 0; while (ids.size !== previous) {
        previous = ids.size;
        rows.forEach(r => { if (r.parent && ids.has(r.parent))
            ids.add(r.id); });
    } update(rows.filter(r => !ids.has(r.id))); close(); api.notify('已删除本地演示记录'); };
    const move = (r: BaselineRow, direction: number) => { const siblings = rows.filter(x => x.parent === r.parent), at = siblings.findIndex(x => x.id === r.id), target = siblings[at + direction]; if (!target)
        return; const ordered = [...rows], i = ordered.findIndex(x => x.id === r.id), j = ordered.findIndex(x => x.id === target.id); [ordered[i], ordered[j]] = [ordered[j], ordered[i]]; update(ordered); };
    const toggle = (id: string) => setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const bodyRows = (() => { if (!config.tree)
        return visible; const sorted: BaselineRow[] = []; const visit = (parent = '') => { for (const r of visible.filter(x => (x.parent || '') === parent)) {
        sorted.push(r);
        visit(r.id);
    } }; visit(); return sorted; })();
    const nameUpdate = (item: string, key: 'number' | 'suffix', value: string) => { const next = { ...names, [item]: { number: names[item]?.number || '', suffix: names[item]?.suffix || '', [key]: value } }; setNames(next); };
    const secondary = ['areas', 'mining', 'imagery', 'datum', 'velocity', 'servers'].includes(config.id);
    const secondaryKey = config.id === 'mining' ? 'type' : config.id === 'imagery' ? 'service' : config.id === 'servers' ? 'primary' : 'basin';
    const secondaryLabel = config.id === 'mining' ? '类型' : config.id === 'imagery' ? '服务类型' : config.id === 'servers' ? '是否主节点' : '盆地';
    return <div className="baseline-layout"><aside className="baseline-sidebar"><h2>基准</h2><nav aria-label="基准栏目">{BASELINE_CONFIGS.map((c, i) => { const Icon = icons[i]; return <button key={c.id} className={c.id === config.id ? 'active' : ''} onClick={() => api.navigate({ page: 'baseline', section: c.id })}><Icon size={19}/>{c.title}</button>; })}</nav></aside><main className="baseline-main"><div className="page-heading"><h1>{config.title}</h1><p>{config.description}</p></div><form className="card baseline-filters" onSubmit={e => { e.preventDefault(); setQuery(draft); setCodeQuery(codeDraft); setExtraQuery(extra); }}>{secondary && <label className="field">{secondaryLabel}<select value={extra} onChange={e => setExtra(e.target.value)}><option value="">全部</option>{[...new Set(rows.map(r => String(r[secondaryKey] || '')).filter(Boolean))].map(x => <option key={x}>{x}</option>)}</select></label>}<label className="field">{config.id === 'naming' ? '搜索' : '名称'}<input placeholder="请输入" value={draft} onChange={e => setDraft(e.target.value)}/></label>{config.id === 'structure' && <label className="field">编码<input placeholder="请输入" value={codeDraft} onChange={e => setCodeDraft(e.target.value)}/></label>}<div className="filter-actions"><button type="button" className="button" onClick={() => { setDraft(''); setQuery(''); setCodeDraft(''); setCodeQuery(''); setExtra(''); setExtraQuery(''); }}>重置</button><button className="button primary">查询</button></div></form>
 <section className="card baseline-list"><header><h2>{config.id === 'naming' ? '项目成果数据命名规则' : config.title + '列表'}</h2><div>{config.tree && config.id === 'structure' && <button className="button" onClick={() => setExpanded(expanded.length ? [] : rows.map(r => r.id))}>{expanded.length ? '收起全部' : '展开全部'}</button>}{config.id === 'naming' ? <><select aria-label="数据类别" defaultValue="处理数据"><option>处理数据</option></select><button className="button primary" onClick={() => { Object.assign(namingCache, names); api.notify('命名规则已保存'); }}>保存</button></> : <button className="button primary" onClick={() => open('new')}><Plus size={16}/>{config.id === 'structure' ? '新增盆地' : '新增' + config.title}</button>}</div></header>
 {config.id === 'naming' ? <div className="table-wrap"><table className="naming-table"><thead><tr><th>数据</th><th>编号</th><th>目录名称</th><th>命名规则</th></tr></thead><tbody>{NAMING_GROUPS.map(g => [<tr key={g.name} className="group-row"><td><ChevronDown size={14}/>{g.name}</td><td>—</td><td>{g.name}</td><td>—</td></tr>, ...g.items.filter(n => !query || n.includes(query)).map(item => <tr key={item}><td className="naming-name">{item}</td><td><input aria-label={item + '编号'} placeholder="请输入序号" value={names[item]?.number || ''} onChange={e => nameUpdate(item, 'number', e.target.value)}/></td><td>{item}</td><td><input aria-label={item + '命名规则'} placeholder="请输入后缀" value={names[item]?.suffix || ''} onChange={e => nameUpdate(item, 'suffix', e.target.value)}/></td></tr>)])}</tbody></table></div> : <div className="table-wrap"><table><thead><tr>{config.id !== 'types' && <th>#</th>}{config.columns.map(([key, label]) => <th key={key}>{label}</th>)}<th>操作</th></tr></thead><tbody>{bodyRows.map((r, index) => { const children = rows.some(x => x.parent === r.id), siblings = rows.filter(x => x.parent === r.parent), at = siblings.findIndex(x => x.id === r.id); return <tr key={r.id}>{config.id !== 'types' && <td>{index + 1}</td>}{config.columns.map(([key]) => <td key={key}>{key === 'name' ? <div className="tree-name" style={{ paddingLeft: ((r.level || 1) - 1) * 24 }}>{config.tree && (children ? <button className="icon-button tree-toggle" aria-label={(expanded.includes(r.id) ? '收起' : '展开') + r.name} onClick={() => toggle(r.id)}>{expanded.includes(r.id) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button> : <span className="tree-spacer"/>)}<button className="link-button" onClick={() => open('detail', r)}>{r.name}</button></div> : key === 'color' ? <span className="color-swatch" style={{ backgroundColor: String(r.color) }}>{r.color}</span> : String(r[key] ?? '') || '—'}</td>)}<td><div className="row-actions"><button className="icon-button" title="编辑" aria-label={'编辑' + r.name} onClick={() => open('edit', r)}><Pencil size={18}/></button>{config.tree && (r.level || 1) < (config.id === 'types' ? 2 : 3) && <button className="icon-button" title="新增下级" aria-label={'新增' + r.name + '下级'} onClick={() => open('new', undefined, r)}><Plus size={18}/></button>}<button className="icon-button danger" title="删除" aria-label={'删除' + r.name} onClick={() => open('delete', r)}><Trash2 size={18}/></button>{config.id === 'types' && <><button className="icon-button" title="上移" aria-label={'上移' + r.name} disabled={at === 0} onClick={() => move(r, -1)}><ArrowUp size={18}/></button><button className="icon-button" title="下移" aria-label={'下移' + r.name} disabled={at === siblings.length - 1} onClick={() => move(r, 1)}><ArrowDown size={18}/></button></>}{config.scan && <button className="icon-button" title="扫描" aria-label={'扫描' + r.name} onClick={() => open('scan', r)}><ScanLine size={18}/></button>}<button className="icon-button" title="查看" aria-label={'查看' + r.name} onClick={() => open('detail', r)}><Eye size={18}/></button></div></td></tr>; })}</tbody></table>{!bodyRows.length && <div className="empty-state"><FileText size={42}/><h3>{query || extraQuery ? '未找到匹配记录' : '暂无数据'}</h3><p>{query ? '调整查询条件后重新查询' : '新增后可在此查看与维护'}</p>{!query && <button className="button primary" onClick={() => open('new')}>新增{config.title}</button>}</div>}</div>}
 <footer>{config.id === 'naming' ? <span>固定成果目录，仅编辑编号及文件后缀</span> : <><span>{bodyRows.length ? '共 ' + bodyRows.length + ' 条' : '—'}</span><span>10 条 / 页 <button className="button" disabled>上一页</button><button className="button primary">1</button><button className="button" disabled>下一页</button></span></>}</footer></section></main>
 {dialog && <Modal title={dialog.mode === 'delete' ? '删除' + config.title : dialog.mode === 'scan' ? '扫描磁盘' : (dialog.mode === 'detail' ? '查看' : dialog.mode === 'edit' ? '编辑' : '新增') + config.title} onClose={close} wide={config.id === 'mining' || config.id === 'closure'} footer={<><button className="button" onClick={close}>{dialog.mode === 'detail' ? '关闭' : '取消'}</button>{dialog.mode === 'delete' ? <button className="button danger-primary" onClick={remove}>确认删除</button> : dialog.mode === 'scan' ? <button className="button primary" onClick={() => { update(rows.map(r => r.id === form.id ? { ...r, scanned: new Date().toLocaleString('sv-SE') } : r)); close(); api.notify('本地演示扫描完成'); }}>开始扫描</button> : dialog.mode !== 'detail' && <button className="button primary" onClick={save}>保存</button>}</>}>
 {dialog.mode === 'delete' ? <p>确定删除“{form.name}”吗？{rows.some(r => r.parent === form.id) && '其下级记录也将删除。'}</p> : dialog.mode === 'scan' ? <div><p>磁盘：{form.name}</p><p>挂载路径：{form.path}</p><p className="muted">扫描演示将更新扫描时间。</p></div> : <><div className="form-grid">{config.id === 'structure' && <div className="baseline-tree-note">上级单元：{rows.find(r => r.id === form.parent)?.name || '无（顶级盆地）'}　单元类型：{form.type || '盆地'}　等级：{form.level || 1}</div>}{config.fields.filter(f => { if (config.id === 'datum') {
            if (f.key === 'value')
                return form.type !== '浮动基准面';
            if (f.kind === 'file')
                return form.type === '浮动基准面';
        } if (config.id === 'velocity') {
            if (f.key === 'value')
                return form.type !== '空变替换速度';
            if (f.kind === 'file')
                return form.type === '空变替换速度';
        } return true; }).map(f => { const options = f.key === 'parent' ? rows.filter(r => r.level === 1 && r.id !== form.id).map(r => ({ value: r.id, label: r.name })) : (f.options || []).map(x => ({ value: x, label: x })); return <label key={f.key} className={'field' + (f.kind === 'textarea' ? ' full' : '')}>{f.label}{f.required && <span className="required"> *</span>}{dialog.mode === 'detail' ? <div className="detail-value">{f.key === 'parent' ? rows.find(r => r.id === form.parent)?.name || '—' : String(form[f.key] || '—')}</div> : f.kind === 'select' ? <select value={String(form[f.key] || '')} onChange={e => setForm({ ...form, [f.key]: e.target.value })}><option value="">请选择</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : f.kind === 'textarea' ? <textarea value={String(form[f.key] || '')} placeholder="请输入" onChange={e => setForm({ ...form, [f.key]: e.target.value })}/> : f.kind === 'file' ? <input type="file" accept=".json,.geojson,.grd,.txt" onChange={e => setForm({ ...form, [f.key]: e.target.files?.[0]?.name || '' })}/> : f.kind === 'color' ? <div className="color-input"><input type="color" aria-label="选择颜色" value={/^#[0-9a-f]{6}$/i.test(String(form.color)) ? String(form.color) : '#277DA8'} onChange={e => setForm({ ...form, color: e.target.value.toUpperCase() })}/><input value={String(form.color || '')} onChange={e => setForm({ ...form, color: e.target.value })}/></div> : <input type={f.kind === 'date' ? 'date' : f.kind === 'number' ? 'number' : 'text'} placeholder="请输入" value={String(form[f.key] ?? '')} onChange={e => setForm({ ...form, [f.key]: e.target.value })}/>}</label>; })}</div>{config.id === 'mining' && <section className="baseline-ranges"><header><h3>矿权范围记录</h3>{dialog.mode !== 'detail' && <button className="button" onClick={() => setRangeCount(n => n + 1)}><Plus size={14}/>添加行</button>}</header>{Array.from({ length: rangeCount }, (_, i) => <div className="form-grid" key={i}><label className="field">日期<input type="date" disabled={dialog.mode === 'detail'} value={String(form['rangeDate' + i] || '')} onChange={e => setForm({ ...form, ['rangeDate' + i]: e.target.value })}/></label><label className="field">登记面积（km²）<input type="number" disabled={dialog.mode === 'detail'} value={String(form[i === 0 ? 'area' : 'area' + i] || '')} onChange={e => setForm({ ...form, [i === 0 ? 'area' : 'area' + i]: e.target.value })}/></label><label className="field full">范围（GeoJSON）<input type="file" disabled={dialog.mode === 'detail'} accept=".json,.geojson" onChange={e => setForm({ ...form, ['rangeFile' + i]: e.target.files?.[0]?.name || '' })}/></label></div>)}</section>}{error && <p role="alert" className="form-error">{error}</p>}</>}
 </Modal>}</div>;
}
