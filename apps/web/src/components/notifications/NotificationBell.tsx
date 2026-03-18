'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const router = useRouter()

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            const data = await res.json()
            if (data.notifications) {
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const markAsRead = async (id: string) => {
        // Optimistic update — no visible flicker, no extra re-fetch needed
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
        } catch (err) {
            console.error(err)
            // Re-fetch on error to restore correct state
            fetchNotifications()
        }
    }

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: 'all' })
            })
        } catch (err) {
            console.error(err)
            fetchNotifications()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span
                            className="text-xs text-blue-600 cursor-pointer hover:underline"
                            onClick={(e) => { e.preventDefault(); markAllAsRead() }}
                        >
                            Mark all as read
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className={`p-3 border-b last:border-0 cursor-pointer flex flex-col items-start ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                                onClick={() => {
                                    if (!n.isRead) markAsRead(n.id)
                                    if (n.link) router.push(n.link)
                                }}
                            >
                                <div className="flex justify-between w-full">
                                    <span className={`font-semibold text-sm ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {n.title}
                                    </span>
                                    {!n.isRead && <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
