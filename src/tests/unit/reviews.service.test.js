import { jest } from "@jest/globals"

const saveMock = jest.fn()
const ReviewMock = jest.fn().mockImplementation((data) => ({ ...data, save: saveMock }))
ReviewMock.find = jest.fn()
ReviewMock.findById = jest.fn()
ReviewMock.findByIdAndUpdate = jest.fn()
ReviewMock.findByIdAndDelete = jest.fn()

await jest.unstable_mockModule("../../models/review.model.js", () => ({
  __esModule: true,
  Review: ReviewMock,
}))

const {
  createReview,
  getReviewsByMovie,
  getReviewById,
  updateReview,
  deleteReview,
  calculateAverage,
  filterByMinRating,
  createReviewObject,
  sortReviews,
} = await import("../../services/review.service.js")

describe("review.service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("database operations", () => {
    it("creates a review using Review.save", async () => {
      saveMock.mockResolvedValue({ id: "review-1", movieId: "movie-1", userId: "user-1", rating: 8 })

      const result = await createReview({ movieId: "movie-1", userId: "user-1", rating: 8 })

      expect(ReviewMock).toHaveBeenCalledWith({ movieId: "movie-1", userId: "user-1", rating: 8 })
      expect(saveMock).toHaveBeenCalled()
      expect(result).toEqual({ id: "review-1", movieId: "movie-1", userId: "user-1", rating: 8 })
    })

    it("gets reviews by movie id", async () => {
      const reviews = [{ movieId: "movie-1", rating: 7 }]
      ReviewMock.find.mockResolvedValue(reviews)

      const result = await getReviewsByMovie("movie-1")

      expect(ReviewMock.find).toHaveBeenCalledWith({ movieId: "movie-1" })
      expect(result).toBe(reviews)
    })

    it("gets a review by id", async () => {
      const review = { id: "review-1", rating: 9 }
      ReviewMock.findById.mockResolvedValue(review)

      const result = await getReviewById("review-1")

      expect(ReviewMock.findById).toHaveBeenCalledWith("review-1")
      expect(result).toBe(review)
    })

    it("updates a review by id", async () => {
      const updatedReview = { id: "review-1", rating: 10 }
      ReviewMock.findByIdAndUpdate.mockResolvedValue(updatedReview)

      const result = await updateReview("review-1", { rating: 10 })

      expect(ReviewMock.findByIdAndUpdate).toHaveBeenCalledWith("review-1", { rating: 10 }, { new: true })
      expect(result).toBe(updatedReview)
    })

    it("deletes a review by id", async () => {
      const deletedReview = { id: "review-1", rating: 6 }
      ReviewMock.findByIdAndDelete.mockResolvedValue(deletedReview)

      const result = await deleteReview("review-1")

      expect(ReviewMock.findByIdAndDelete).toHaveBeenCalledWith("review-1")
      expect(result).toBe(deletedReview)
    })
  })

  describe("pure helper functions", () => {
    it("returns 0 average for empty ratings", () => {
      expect(calculateAverage([])).toBe(0)
    })

    it("calculates the average rating", () => {
      expect(calculateAverage([4, 6, 8])).toBe(6)
    })

    it("filters reviews by minimum rating", () => {
      const reviews = [
        { rating: 2 },
        { rating: 5 },
        { rating: 8 },
      ]

      expect(filterByMinRating(reviews, 5)).toEqual([
        { rating: 5 },
        { rating: 8 },
      ])
    })

    it("creates a valid review object", () => {
      const review = createReviewObject("movie-1", "user-1", 7, "Buen comentario")

      expect(review).toMatchObject({
        movieId: "movie-1",
        userId: "user-1",
        rating: 7,
        comment: "Buen comentario",
      })
      expect(typeof review.createdAt).toBe("string")
    })

    it("throws if required fields are missing", () => {
      expect(() => createReviewObject(null, "user-1", 5)).toThrow(
        "movieId, userId y rating son obligatorios",
      )
    })

    it("throws if rating is outside the allowed range", () => {
      expect(() => createReviewObject("movie-1", "user-1", 11)).toThrow(
        "El rating debe tener un valor entre 1 y 10",
      )
    })

    it("sorts reviews in descending order by default", () => {
      const reviews = [{ rating: 2 }, { rating: 9 }, { rating: 5 }]
      expect(sortReviews(reviews)).toEqual([{ rating: 9 }, { rating: 5 }, { rating: 2 }])
    })

    it("sorts reviews in ascending order when requested", () => {
      const reviews = [{ rating: 2 }, { rating: 9 }, { rating: 5 }]
      expect(sortReviews(reviews, "asc")).toEqual([{ rating: 2 }, { rating: 5 }, { rating: 9 }])
    })
  })
})
