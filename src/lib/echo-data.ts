export type EchoRecord = {
  id: string
  content: string
  createdAtLabel: string
  authorName: string
  authorUsername: string
  authorImage?: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
}

export const postedEchoes: EchoRecord[] = [
  {
    id: "echo_1",
    content:
      "Built the first draft of my profile echo wall today. Keeping it simple and clean.",
    createdAtLabel: "2h",
    authorName: "Aarav Patel",
    authorUsername: "aarav",
    likeCount: 14,
    commentCount: 3,
    shareCount: 1,
    saveCount: 5,
  },
  {
    id: "echo_2",
    content:
      "Trying a dialog-based echo composer on the profile page. UI-first, backend later.",
    createdAtLabel: "1d",
    authorName: "Aarav Patel",
    authorUsername: "aarav",
    likeCount: 28,
    commentCount: 6,
    shareCount: 2,
    saveCount: 8,
  },
  {
    id: "echo_3",
    content:
      "Today’s goal: keep the profile area focused and move the feed into its own panel.",
    createdAtLabel: "3d",
    authorName: "Aarav Patel",
    authorUsername: "aarav",
    likeCount: 7,
    commentCount: 2,
    shareCount: 0,
    saveCount: 4,
  },
]

export const savedEchoes: EchoRecord[] = [
  {
    id: "saved_1",
    content: "Small UI details matter more than big features when the layout is messy.",
    createdAtLabel: "saved 4h ago",
    authorName: "Mira Chen",
    authorUsername: "mira",
    likeCount: 91,
    commentCount: 18,
    shareCount: 12,
    saveCount: 44,
  },
  {
    id: "saved_2",
    content: "A clean feed is mostly about restraint: spacing, hierarchy, and rhythm.",
    createdAtLabel: "saved yesterday",
    authorName: "Noah Kim",
    authorUsername: "noah",
    likeCount: 63,
    commentCount: 11,
    shareCount: 7,
    saveCount: 26,
  },
  {
    id: "saved_3",
    content: "I like when a profile page feels like a dashboard for personal writing.",
    createdAtLabel: "saved 2d ago",
    authorName: "Isha Rao",
    authorUsername: "isha",
    likeCount: 38,
    commentCount: 5,
    shareCount: 3,
    saveCount: 19,
  },
]

export const allEchoes = [...postedEchoes, ...savedEchoes]

export function getEchoById(echoId: string) {
  return allEchoes.find((echo) => echo.id === echoId)
}
