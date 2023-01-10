
import { Inter } from '@next/font/google'
import { useState } from 'react'
import styles from '../styles/Home.module.css'
import ChartRenderer from './components/transactions-count' 

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  // drop down component to select type of graph
  const [graphType, setGraphType] = useState('line');
  // const graphTypes = ['line', 'bar', 'pie', 'area'];
  return (
    <>
      <main className={styles.main}>

      <ChartRenderer type={graphType}/>
      </main>
    </>
  )
}
