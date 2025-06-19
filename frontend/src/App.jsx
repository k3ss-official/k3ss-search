import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  Search, 
  FolderOpen, 
  FileText, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  HardDrive,
  Cloud,
  ExternalLink
} from 'lucide-react'
import './App.css'

const API_BASE_URL = 'http://localhost:5000/api'

function App() {
  const [storageLocations, setStorageLocations] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [searchTerms, setSearchTerms] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [formattedContent, setFormattedContent] = useState('')
  const [showFormatted, setShowFormatted] = useState(false)

  useEffect(() => {
    discoverStorageLocations()
  }, [])

  const discoverStorageLocations = async () => {
    setIsDiscovering(true)
    try {
      const response = await fetch(`${API_BASE_URL}/discover-locations`)
      const data = await response.json()
      if (data.success) {
        setStorageLocations(data.locations)
      }
    } catch (error) {
      console.error('Error discovering storage locations:', error)
    } finally {
      setIsDiscovering(false)
    }
  }

  const handleLocationToggle = (locationPath) => {
    setSelectedLocations(prev => 
      prev.includes(locationPath) 
        ? prev.filter(path => path !== locationPath)
        : [...prev, locationPath]
    )
  }

  const handleSearch = async () => {
    if (!selectedLocations.length || !searchTerms.trim()) {
      return
    }

    setIsLoading(true)
    setSearchResults([])
    setSelectedFiles([])

    try {
      const terms = searchTerms.split(',').map(term => term.trim()).filter(term => term)
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: selectedLocations,
          terms: terms,
          searchContent: true
        })
      })

      const data = await response.json()
      if (data.success) {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileToggle = (fileIndex) => {
    setSelectedFiles(prev => 
      prev.includes(fileIndex) 
        ? prev.filter(index => index !== fileIndex)
        : [...prev, fileIndex]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === searchResults.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(searchResults.map((_, index) => index))
    }
  }

  const handleFormatForLLM = async () => {
    if (!selectedFiles.length) return

    setIsLoading(true)
    try {
      const selectedFileData = selectedFiles.map(index => searchResults[index])
      const terms = searchTerms.split(',').map(term => term.trim()).filter(term => term)
      
      const response = await fetch(`${API_BASE_URL}/format-llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFileData,
          terms: terms
        })
      })

      const data = await response.json()
      if (data.success) {
        setFormattedContent(data.formatted_content)
        setShowFormatted(true)
      }
    } catch (error) {
      console.error('Error formatting for LLM:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'cloud':
        return <Cloud className="h-4 w-4" />
      case 'external':
        return <ExternalLink className="h-4 w-4" />
      default:
        return <HardDrive className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-800">File Search & Collection Tool</h1>
          <p className="text-slate-600">Discover, search, and collect documents for LLM processing</p>
        </div>

        {/* Storage Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Storage Locations
            </CardTitle>
            <CardDescription>
              Select the storage locations you want to search
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDiscovering ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Discovering storage locations...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storageLocations.map((location, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <Checkbox
                      id={`location-${index}`}
                      checked={selectedLocations.includes(location.path)}
                      onCheckedChange={() => handleLocationToggle(location.path)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {getLocationIcon(location.type)}
                      <div>
                        <Label htmlFor={`location-${index}`} className="font-medium cursor-pointer">
                          {location.name}
                        </Label>
                        <p className="text-sm text-slate-500">{location.path}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Terms
            </CardTitle>
            <CardDescription>
              Enter search terms separated by commas (e.g., "Victoria, gytj, dwp ai tool")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter search terms..."
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={!selectedLocations.length || !searchTerms.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Files
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Search Results ({searchResults.length} files)
                  </CardTitle>
                  <CardDescription>
                    Select files to include in your LLM-formatted collection
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSelectAll}>
                    {selectedFiles.length === searchResults.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    onClick={handleFormatForLLM}
                    disabled={!selectedFiles.length || isLoading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Format for LLM ({selectedFiles.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {searchResults.map((file, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <Checkbox
                        id={`file-${index}`}
                        checked={selectedFiles.includes(index)}
                        onCheckedChange={() => handleFileToggle(index)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`file-${index}`} className="font-medium cursor-pointer">
                            {file.name}
                          </Label>
                          <Badge variant="secondary">{file.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{file.path}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{new Date(file.modified).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {file.matches.map((match, matchIndex) => (
                            <Badge key={matchIndex} variant="outline" className="text-xs">
                              {match}
                            </Badge>
                          ))}
                        </div>
                        {file.content_preview && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                            {file.content_preview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Formatted Output */}
        {showFormatted && formattedContent && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    LLM-Formatted Content
                  </CardTitle>
                  <CardDescription>
                    Ready to copy and paste into your LLM conversation
                  </CardDescription>
                </div>
                <Button onClick={() => copyToClipboard(formattedContent)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formattedContent}
                readOnly
                className="min-h-96 font-mono text-sm"
                placeholder="Formatted content will appear here..."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App

