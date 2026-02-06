'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '../components/ui/Card'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router, supabase])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
      <Card className="flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="h-8 w-8 bg-indigo-500 rounded-full mb-4"></div>
        <h1 className="text-slate-400 font-medium">Cargando aplicación...</h1>
      </Card>
    </main>
  )
}
//