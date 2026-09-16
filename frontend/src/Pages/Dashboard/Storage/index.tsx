import { useContext, useEffect, useMemo, useState } from 'react';
import { FileText, HardDrive, Image, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useDispatch, useSelector } from 'react-redux';
import { settingContext } from '@/StateManagement/ContextAPI/SettingContext/SettingContext';
import type { AppDispatch, RootState } from '@/StateManagement/Redux/reduxStore';
import { fetchFiles } from '@/StateManagement/Redux/slices/storageslices';
import { FileFormModal } from './Components/AddFileForm';
import { ImagesFolder } from './Components/ImagesFolder';

const bytes = (value: number) => value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${(value / 1024).toFixed(1)} KB`;
export default function Media() {
  const { collapsed } = useContext(settingContext);
  const dispatch = useDispatch<AppDispatch>();
  const { files, loading, error } = useSelector((state: RootState) => state.storage);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'images' | 'other'>('all');
  useEffect(() => { if (!files.length) void dispatch(fetchFiles()); }, [dispatch, files.length]);
  const stats = useMemo(() => { const images = files.filter(file => String(file.metadata?.mimetype || '').startsWith('image/')).length; return { images, size: files.reduce((sum, file) => sum + Number(file.metadata?.size || 0), 0) }; }, [files]);
  const visible = useMemo(() => files.filter(file => { const image = String(file.metadata?.mimetype || '').startsWith('image/'); return (filter === 'all' || (filter === 'images' ? image : !image)) && file.name.toLowerCase().includes(search.trim().toLowerCase()); }), [files, filter, search]);
  const width = collapsed ? 'w-[calc(100vw-70px)]' : 'w-[calc(100vw-240px)]';
  return <main className={`h-full min-w-0 overflow-y-auto bg-background text-gray-800 transition-all dark:bg-darkthemebg dark:text-gray-100 ${width}`}><div className="mx-auto max-w-7xl p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Media library</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Upload, preview, replace, and manage portfolio assets.</p></div><div className="flex gap-2"><button disabled={loading} onClick={() => void dispatch(fetchFiles())} className="grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" aria-label="Refresh media"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button><Dialog.Root modal><Dialog.Trigger asChild><button className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"><Plus size={17} />Add media</button></Dialog.Trigger><FileFormModal /></Dialog.Root></div></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total assets" value={String(files.length)} icon={HardDrive} /><Stat label="Images" value={String(stats.images)} icon={Image} /><Stat label="Other files" value={String(files.length - stats.images)} icon={FileText} /><Stat label="Storage used" value={bytes(stats.size)} icon={HardDrive} /></section>
    <section className="mt-5 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search file name…" className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900" /></label><div className="flex rounded-md border border-gray-300 p-1 dark:border-gray-600">{(['all','images','other'] as const).map(item => <button key={item} onClick={() => setFilter(item)} className={`cursor-pointer rounded px-3 py-1.5 text-xs capitalize ${filter === item ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{item}</button>)}</div></section>
    {loading ? <div className="flex justify-center gap-3 py-24 text-gray-500"><Loader2 className="animate-spin" />Loading media…</div> : error ? <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">Unable to load media. {error}</div> : <ImagesFolder files={visible} />}
  </div></main>;
}
function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof HardDrive }) { return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p></div><span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon size={20} /></span></div></article>; }
