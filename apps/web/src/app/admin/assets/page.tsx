'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Upload,
  Search,
  Image as ImageIcon,
  FileText,
  Trash2,
  Download,
  Grid,
  List,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

interface Asset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  category: string
  tags: string[]
  createdAt: string
}

const categories = [
  { id: 'all', name: 'All Assets' },
  { id: 'SHAPE_IMAGE', name: 'Shapes' },
  { id: 'FOAM_IMAGE', name: 'Foam Types' },
  { id: 'ZIPPER_IMAGE', name: 'Zippers' },
  { id: 'PIPING_IMAGE', name: 'Piping' },
  { id: 'TIES_IMAGE', name: 'Ties' },
  { id: 'FABRIC_IMAGE', name: 'Fabrics' },
  { id: 'LOGO', name: 'Logos' },
  { id: 'DOCUMENT', name: 'Documents' },
]

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [selectedCategory])

  const fetchAssets = async () => {
    try {
      const url = selectedCategory === 'all'
        ? `/api/assets?_t=${Date.now()}`
        : `/api/assets?category=${selectedCategory}&_t=${Date.now()}`
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } })
      const data = await res.json()
      setAssets(data)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setUploading(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setUploadDialogOpen(false)
        fetchAssets()
      }
    } catch (error) {
      console.error('Failed to upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setUploading(true)
    try {
      const res = await fetch('/api/assets/bulk-fabrics', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        window.location.reload()
      } else {
        console.error('Failed to bulk upload')
      }
    } catch (error) {
      console.error('Failed to bulk upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchAssets()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete asset')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('An error occurred while deleting the asset')
    }
  }

  const filteredAssets = assets.filter(asset =>
    asset.originalName.toLowerCase().includes(search.toLowerCase()) ||
    asset.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  // human-readable labels for categories
  const categoryLabels: Record<string, string> = {
    SHAPE_IMAGE: 'Shape',
    FOAM_IMAGE: 'Foam',
    FABRIC_IMAGE: 'Fabric',
    LOGO: 'Logo',
    DOCUMENT: 'Document',
    ZIPPER_IMAGE: 'Zipper',
    PIPING_IMAGE: 'Piping',
    TIES_IMAGE: 'Ties',
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">
            Manage images, documents, and other assets
          </p>
        </div>

        <div className="flex gap-3">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Individual Asset</DialogTitle>
                <DialogDescription>
                  Upload a shape, foam, zipper, piping or ties image
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">File Image</label>
                  <Input type="file" name="file" accept="image/*" required />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Item Category</label>
                  <select name="category" className="w-full p-2 border rounded-md">
                    <option value="SHAPE_IMAGE">Shape</option>
                    <option value="FOAM_IMAGE">Foam Type</option>
                    <option value="ZIPPER_IMAGE">Zipper</option>
                    <option value="PIPING_IMAGE">Piping</option>
                    <option value="TIES_IMAGE">Ties</option>
                    <option value="FABRIC_IMAGE">Fabric</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                  <Input name="tags" placeholder="e.g., triangle, premium, red" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                <FileText className="mr-2 h-4 w-4" /> Bulk Fabric Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Fabrics (CSV)</DialogTitle>
                <DialogDescription>
                  Upload a CSV file and matching images directory for fabrics.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">1. Fabric Category / Tier</label>
                  <select name="fabricCategory" className="w-full p-2 border rounded-md">
                    <option value="Normal">Normal</option>
                    <option value="Premium">Premium</option>
                    <option value="Others" selected>Others (Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">2. CSV Dataset (id, label, price)</label>
                  <Input type="file" name="csvFile" accept=".csv" required />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">3. Fabric Images Folder</label>
                  {/* webkitdirectory allows selecting a folder recursively */}
                  <input type="file" name="images" multiple {...({ webkitdirectory: "true", directory: "true" } as any)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  <p className="text-xs text-gray-500 mt-1">Image names must exactly match the "id" column in your CSV.</p>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload Fabrics'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>


      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No assets found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {isImage(asset.mimeType) ? (
                      <Image
                        src={asset.url}
                        alt={asset.originalName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <a href={asset.url} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs mt-2 truncate">{asset.originalName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(asset.size)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      {isImage(asset.mimeType) ? (
                        <Image src={asset.url} alt="" width={48} height={48} className="rounded-lg" />
                      ) : (
                        <FileText className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{asset.originalName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="secondary">{categoryLabels[asset.category] || asset.category}</Badge>
                        <span>{formatFileSize(asset.size)}</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={asset.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(asset.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
