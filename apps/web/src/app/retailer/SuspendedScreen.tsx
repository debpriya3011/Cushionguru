'use client'

import { signOut } from 'next-auth/react'
import { LogOut, AlertTriangle } from 'lucide-react'

export function SuspendedScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Suspended</h1>
                <p className="text-gray-600 mb-8">
                    Your account has been suspended. Please contact the administrator for further details. You can log out using the button below.
                </p>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                </button>
            </div>
        </div>
    )
}
