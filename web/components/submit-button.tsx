'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
