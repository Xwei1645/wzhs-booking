
import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const userInfo = getCookie(event, 'userInfo')
    if (!userInfo) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = JSON.parse(userInfo)
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { status } = body

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing id' })
    }

    try {
        // Check if booking exists and belongs to user (or user is admin)
        const booking = await db.booking.findUnique({
            where: { id: Number(id) }
        })

        if (!booking) {
            throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
        }

        if (booking.userId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }

        const updatedBooking = await db.booking.update({
            where: { id: Number(id) },
            data: { status }
        })

        return updatedBooking
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
