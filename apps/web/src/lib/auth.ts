import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { retailer: true },
        })

        if (!user || user.status !== 'ACTIVE') {
          return null
        }

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
          retailerId: user.retailerId || undefined,
          retailer: user.retailer ? {
            businessName: user.retailer.businessName,
            status: user.retailer.status,
            markupType: user.retailer.markupType,
            markupValue: user.retailer.markupValue
          } : undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.retailerId = user.retailerId
        token.retailer = user.retailer
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.retailerId = token.retailerId as string | undefined
        session.user.retailer = token.retailer as any
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      retailerId?: string
      retailer?: any
    }
  }

  interface User {
    role: string
    retailerId?: string
    retailer?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    retailerId?: string
    retailer?: any
  }
}
