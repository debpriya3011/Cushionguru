'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, HelpCircle, Loader2 } from 'lucide-react'

export default function RetailerHelpPage() {
    const [supportEmail, setSupportEmail] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/platform/branding')
            .then(res => res.json())
            .then(data => {
                if (data.supportEmail) {
                    setSupportEmail(data.supportEmail)
                } else {
                    setSupportEmail('support@cushionsaas.com')
                }
            })
            .catch(err => {
                console.error(err)
                setSupportEmail('support@cushionsaas.com')
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
                <p className="text-gray-600 mt-1">Get assistance with your dashboard and quotes</p>
            </div>

            <Card className="mt-8 border-blue-100 shadow-sm">
                <CardHeader className="bg-blue-50/50 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">We're here to help</CardTitle>
                            <CardDescription className="text-blue-700/80">
                                Contact the platform administration for any issues or inquiries.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-8 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-gray-50 border rounded-xl gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" /> Email Support
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 max-w-sm">
                                    Send us a message at {supportEmail} and our support team will get back to you as soon as possible.
                                </p>
                            </div>
                            <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-primary-foreground hover:bg-blue-600/90 h-10 px-4 py-2 shrink-0"
                            >
                                Contact Support
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
