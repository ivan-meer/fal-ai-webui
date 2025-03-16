import { redirect } from 'next/navigation';

// このページはサーバーコンポーネントで、直接リダイレクトを行う
export default function Home() {
  // Nextのredirect関数は、レンダリング中に呼び出されるとリダイレクトを実行する
  redirect('/generate');
} 