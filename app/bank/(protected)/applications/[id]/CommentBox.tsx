'use client'

import { useActionState, useRef } from 'react'
import { addCommentAction, CommentState } from './actions'
import { Button } from '@/components/ui/Button'

const initialState: CommentState = {}

export function CommentBox({ applicationId }: { applicationId: string }) {
  const boundAction = addCommentAction.bind(null, applicationId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  if (state.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <textarea
        name="content"
        rows={3}
        placeholder="Ajouter un commentaire interne..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        required
      />
      <div className="flex justify-end">
        <Button type="submit" loading={pending} size="sm">Ajouter</Button>
      </div>
    </form>
  )
}
