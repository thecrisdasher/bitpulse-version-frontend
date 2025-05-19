import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newsArticles } from "@/lib/mockData"

const NewsFeed = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {newsArticles.map((article) => (
            <li key={article.id}>
              <a href={article.url} className="block hover:bg-secondary p-2 rounded-md transition-colors">
                <h3 className="font-semibold text-primary">{article.title}</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>{article.source}</span>
                  <span className="mx-2">•</span>
                  <span>{article.date}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default NewsFeed
