import { useState } from 'react';
import { Search, Sparkles, RefreshCw, Copy, ChevronUp, ChevronDown, X, List, FileSearch } from 'lucide-react';
import { Modal } from '../components/Modal';
import { facets, querySearch, toggleValue } from '../services/demo';
import type { AppApi, SearchRecord, SearchState } from '../types';
import './SearchPage.css';

const fields = [['all','全部字段'],['name','项目名称'],['basin','盆地/工区'],['type','项目类型'],['year','年度']];
const groups: [keyof SearchRecord,string][] = [['basin','盆地'],['type','项目类型'],['dimension','勘探类型'],['year','年度']];
const trials = [['basin','沁水盆地','盆地名称'],['type','解释项目','项目类型'],['year','2024','年度']];

export default function SearchPage({api}:{api:AppApi}) {
 const {state,setState,notify} = api;
 const search = state.search;
 const rows = querySearch(search,state.role);
 const [tab,setTab] = useState('项目');
 const [closed,setClosed] = useState<string[]>([]);
 const [detail,setDetail] = useState<SearchRecord|null>(null);
 const change = (patch:Partial<SearchState>) => setState(s=>({...s,search:{...s.search,...patch}}));
 const execute = () => change({query:search.draft});
 const toggle = (key:string,value:string) => change({filters:{...search.filters,[key]:toggleValue(search.filters[key]||[],value)}});
 const summary = rows.length ? `当前检索命中 ${rows.length} 个项目，项目类型为${[...new Set(rows.map(r=>r.type))].join('、')}，勘探类型为${[...new Set(rows.map(r=>r.dimension))].join('、')}。\n${rows.map(r=>`${r.basin}项目年度为 ${r.year} 年`).join('；')}。` : '当前条件没有匹配的项目，可以调整关键词或筛选条件后重新检索。';
 const copySummary = async () => {try {await navigator.clipboard.writeText(summary);notify('已复制 AI 演示摘要')} catch {notify('复制不可用，请选中摘要文字复制')}};
 return <main className="search-page">
  <section className="search-header">
   <div className="search-heading"><div><h1>数据检索</h1><p>输入关键词检索数据资源与文档资料，可开启 AI 智能搜索</p></div><label className="search-ai-switch">AI 搜索 <button role="switch" aria-label="AI 搜索" aria-checked={search.ai} className={'switch'+(search.ai?' on':'')} onClick={()=>change({ai:!search.ai})}><span/></button><span>{search.ai?'已开启':'已关闭'}</span></label></div>
   <form className="search-bar" onSubmit={e=>{e.preventDefault();execute()}}><div className="search-input-wrap"><select aria-label="检索字段" value={search.field} onChange={e=>change({field:e.target.value})}>{fields.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><Search size={21}/><input aria-label="检索关键词" placeholder="输入关键词检索…" value={search.draft} onChange={e=>change({draft:e.target.value})}/></div><button className="button primary" type="submit"><Search size={20}/>搜索</button></form>
   <div className="search-trials" aria-label="试试关键词"><span>试试：</span>{trials.map(([field,query,label])=><button key={field} onClick={()=>change({field,query,draft:query})}>{label}</button>)}</div>
   <div className="search-tabs" role="tablist" aria-label="检索结果栏目">{['项目','数据','文档'].map(v=><button role="tab" aria-selected={tab===v} className={tab===v?'active':''} key={v} onClick={()=>setTab(v)}>{v}</button>)}</div>
  </section>
  <div className="search-body"><aside className="search-filters card"><header><strong>筛选条件</strong><button className="text-button" onClick={()=>change({filters:{}})}>清空</button></header><small>未选择时检索全部</small>
   {groups.map(([key,label])=>{const values=facets(rows,key);return <section className="facet-group" key={key}><button className="facet-title" aria-expanded={!closed.includes(key)} onClick={()=>setClosed(v=>toggleValue(v,key))}><strong>{label}</strong>{closed.includes(key)?<ChevronDown size={16}/>:<ChevronUp size={16}/>}</button>{!closed.includes(key)&&(values.length?values.map(([value,count])=><label className="facet-option" key={value}><input type="checkbox" checked={(search.filters[key]||[]).includes(value)} onChange={()=>toggle(key,value)}/><span>{value}</span><span className="facet-count" aria-label={`${value}检索结果数量`}>{count}</span></label>):<p className="facet-none">暂无匹配选项</p>)}</section>})}
  </aside><section className="search-results">
   {!!Object.values(search.filters).flat().length&&<div className="search-chips" aria-label="已选筛选条件">{Object.entries(search.filters).flatMap(([key,values])=>values.map(value=><button key={key+value} onClick={()=>toggle(key,value)} aria-label={`取消筛选 ${value}`}>{value}<X size={14}/></button>))}</div>}
   {tab==='项目'?<>
    {search.ai&&<article className="search-summary card"><header><strong><Sparkles size={24}/> AI 智能总结 <span className="badge">已生成</span></strong><div><button className="text-button" title="重新生成演示摘要" onClick={()=>notify('已根据当前结果重新生成演示摘要')}><RefreshCw size={16}/>重新生成</button><button className="text-button" onClick={copySummary}><Copy size={16}/>复制</button><button className="text-button" onClick={()=>change({summaryCollapsed:!search.summaryCollapsed})}>{search.summaryCollapsed?<ChevronDown size={16}/>:<ChevronUp size={16}/>} {search.summaryCollapsed?'展开':'收起'}</button></div></header>{!search.summaryCollapsed&&<><p>{summary}</p><small>依据当前 {rows.length} 条项目结果生成 · 本地演示摘要</small></>}</article>}
    <div className="search-result-tools card"><div>共找到 <strong aria-label="项目结果数量">{rows.length}</strong> 条项目结果 <span className="tool-divider"/>当前检索：<b>{fields.find(([v])=>v===search.field)?.[1]}{search.query?' · '+search.query:''}</b></div><div><span>排序</span><button className={'text-button'+(search.sort==='relevance'?' selected':'')} onClick={()=>change({sort:'relevance'})}>相关度</button><button className={'text-button'+(search.sort==='year'?' selected':'')} onClick={()=>change({sort:'year'})}>↓ 年度</button><span className="tool-divider"/><span className="list-only"><List size={16}/>列表</span></div></div>
    {rows.length?rows.map((r,i)=><article className="search-result-card card" key={r.id}><div className="result-number">{String(i+1).padStart(2,'0')}</div><div className="result-card-content"><h2>{r.name}</h2><dl><div><dt>所属区域</dt><dd>{r.basin}</dd></div><div><dt>项目类型</dt><dd>{r.type}</dd></div><div><dt>勘探类型</dt><dd>{r.dimension}</dd></div><div><dt>项目年度</dt><dd>{r.year}</dd></div></dl></div><div className="result-card-actions"><span className="badge">{r.archived?'已归档':'未归档'}</span><button className="button" onClick={()=>setDetail(r)}>查看参数</button></div></article>):<div className="card empty-state"><FileSearch size={52}/><h2>暂无匹配项目</h2><p>请调整关键词或筛选条件后重试</p></div>}
    {rows.length>0&&<footer className="search-pagination"><span>1–{rows.length} / 共 {rows.length} 条</span><select aria-label="每页结果数量"><option>30 条/页</option></select><button className="button" disabled>首页</button><button className="button" disabled>上一页</button><button className="button primary">1</button><button className="button" disabled>下一页</button><button className="button" disabled>末页</button></footer>}
   </>:<div className="card empty-state"><FileSearch size={52}/><h2>暂无{tab}结果</h2><p>当前设计未提供{tab}结果样例</p></div>}
  </section></div>
  {detail&&<Modal title="项目参数" onClose={()=>setDetail(null)} footer={<button className="button" onClick={()=>setDetail(null)}>关闭</button>}><h3>{detail.name}</h3><dl className="parameter-grid"><dt>所属区域</dt><dd>{detail.basin}</dd><dt>项目类型</dt><dd>{detail.type}</dd><dt>勘探类型</dt><dd>{detail.dimension}</dd><dt>项目年度</dt><dd>{detail.year}</dd><dt>归档状态</dt><dd>{detail.archived?'已归档':'未归档'}</dd></dl></Modal>}
 </main>
}
