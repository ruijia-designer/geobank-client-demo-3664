import type { Project } from '../types';
export interface ResultInfo {
    name: string;
    basin: string;
    areaName: string;
    depression: string;
    concavity: string;
    location: string;
    area: string;
    client: string;
    contractor: string;
    start: string;
    end: string;
    year: string;
    note: string;
    [key: string]: string;
}
export interface ResultFile {
    id: string;
    name: string;
    format: string;
    size: string;
    uploaded: string;
    user: string;
    directory: string;
}
export const RESULT_DIRECTORIES = [{ name: '基本信息', icon: 'info', items: ['项目信息', '关联项目'] }, { name: '井筒数据', count: '4/8', icon: 'well', items: ['井位坐标、轨迹', '测井数据', '时深关系', '地质分层', '测井岩性和油气水解释结论', '岩芯', '测井沉积微相解释结论', '试油成果'] }, { name: '处理数据', count: '0/2', icon: 'data', items: ['偏移叠加纯波数据', '偏移叠加成果数据'] }, { name: '解释成果', icon: 'layers', items: ['层位', '断层', '断层多边形', '地质体', '地震相', '地震属性'] }, { name: '反演与建模', count: '0/2', icon: 'data', items: ['叠后反演结果', '全套速度场'] }, { name: '综合成图', count: '1/4', icon: 'map', items: ['地层厚度图', '时间构造图', '深度构造图', '其它成图'] }, { name: '项目文档', count: '0/2', icon: 'file', items: ['项目设计文档', '项目成果文档'] }];
const note = '精细标定、对比追踪 T5、T6、T8、Tg、Tg3、Tg4-1、TgAr等各层反射层，对该地区进行了构造研究；落实研究区3#、15#煤层厚度变化规律，结合构造、断裂、煤层厚度和含气量等综合评价煤层有利区。';
export function initialResultInfo(p: Project): ResultInfo { const empty = p.id.startsWith('created-'); return { name: p.name, basin: p.basin, areaName: '', depression: '', concavity: '', location: empty ? '' : p.id === 'current' ? '太岳山东侧' : '', area: p.area, client: '', contractor: '', start: empty ? '' : '2024-05-30', end: empty ? '' : '2024-11-15', year: p.year, note: empty ? '' : note }; }
const names = ['An18', 'An19', 'An22', 'An24', 'An26', 'An28', 'An29', 'An30', 'An31', 'An53X', 'An61X', 'An62X', 'An65X', 'An66X', 'An70X', 'An72X', 'Q7-6', 'Q8-9'];
const sizes = ['681.86', '560.60', '750.95', '555.46', '578.29', '758.51', '628.90', '579.84', '756.82', '504.92', '521.16', '452.82', '651.74', '422.93', '446.14', '736.05', '292.67', '768.85'];
export const WELL_FILES: ResultFile[] = names.map((n, i) => ({ id: 'well-' + i, name: n + '.las', format: 'las', size: sizes[i] + ' KB', uploaded: '2026-09-29 09:52:' + String(35 + Math.floor(i / 6)), user: '超级管理员', directory: '测井数据' }));
export const REMOTE_FILES = WELL_FILES.slice(0, 3).map(r => ({ ...r, id: 'remote-' + r.id }));
export const resultInfoCache: Record<string, ResultInfo> = {};
export const resultFilesCache: Record<string, ResultFile[]> = {};
export function saveProjectInfo(id:string,info:ResultInfo){resultInfoCache[id]={...info};return resultInfoCache[id]}
export function saveDirectoryFiles(id:string,files:ResultFile[]){resultFilesCache[id]=files.map(f=>({...f}));return resultFilesCache[id]}
export function importProjectInformation(info:ResultInfo){return {...info,basin:'沁水盆地',location:'太岳山东侧',area:'96.8',start:'2024-05-30',end:'2024-11-15',year:'2024'}}
export function appendUploadedFiles(current:ResultFile[],files:ResultFile[],directory:string){return [...current,...files.map((f,i)=>({...f,id:'uploaded-'+Date.now()+'-'+i,directory,uploaded:new Date().toLocaleString('sv-SE'),user:'Demo'}))]}
export function removeFiles(files:ResultFile[],ids:string[]){return files.filter(f=>!ids.includes(f.id))}
export function bytesLabel(n: number) { return n < 1024 ? n + ' B' : n < 1024 * 1024 ? (n / 1024).toFixed(2) + ' KB' : (n / 1024 / 1024).toFixed(2) + ' MB'; }
