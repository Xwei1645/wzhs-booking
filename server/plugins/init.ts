import { db } from '../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineNitroPlugin(async (nitroApp) => {
    try {
        const userCount = await db.user.count()

        if (userCount === 0) {
            console.log('No users found. Creating default root admin...')

            const hashedPassword = await bcrypt.hash('admin123456', 10)

            await db.user.create({
                data: {
                    account: 'system',
                    password: hashedPassword,
                    name: '根管理员',
                    role: 'root',
                    status: true
                }
            })

            console.log('Default root admin created: system / admin123456')
        }
    } catch (error) {
        console.error('Failed to initialize database:', error)
    }
})
