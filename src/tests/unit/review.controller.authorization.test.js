import { jest } from "@jest/globals"

const reviewService = {
  getReviewById: jest.fn(),
  deleteReview: jest.fn(),
}

await jest.unstable_mockModule("../../services/review.service.js", () => ({
  __esModule: true,
  ...reviewService,
}))

const { deleteReview } = await import("../../controllers/review.controller.js")

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

describe("deleteReview - autorización por propietario", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("impide que un usuario elimine la review de otro usuario", async () => {
    reviewService.getReviewById.mockResolvedValue({
      id: "review-1",
      userId: "owner-1",
    })

    const req = {
      params: { id: "review-1" },
      user: { id: "other-user", role: "user" },
    }
    const res = createResponse()
    const next = jest.fn()

    await deleteReview(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(reviewService.deleteReview).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
