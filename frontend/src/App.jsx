import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { 
  Search, 
  FolderOpen, 
  FileText, 
  Copy, 
  CheckCircle, 
  Loader2,
  HardDrive,
  Cloud,
  ExternalLink,
  Activity,
  RefreshCw,
  Check,
  BarChart3,
  Zap,
  User,
  Settings,
  Home,
  Database
} from 'lucide-react'
import './App.css'

const API_BASE_URL = 'http://localhost:5002/api'

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
  const [searchProgress, setSearchProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [deepSearch, setDeepSearch] = useState(false)
  const [searchStats, setSearchStats] = useState(null)

  useEffect(() => {
    discoverStorageLocations()
  }, [])

  const updateStatus = (status) => {
    setCurrentStatus(status)
  }

  const discoverStorageLocations = async () => {
    setIsDiscovering(true)
    updateStatus('Discovering storage locations...')
    
    try {
      const response = await fetch(`${API_BASE_URL}/discover-locations`)
      const data = await response.json()
      if (data.success) {
        setStorageLocations(data.locations)
        updateStatus(`Found ${data.locations.length} storage locations`)
        setTimeout(() => setCurrentStatus(''), 2000)
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
    if (!selectedLocations.length || !searchTerms.trim()) return

    setIsLoading(true)
    setSearchResults([])
    setSelectedFiles([])
    setSearchProgress(0)
    setSearchStats(null)
    updateStatus('Searching...')

    try {
      const terms = searchTerms.split(',').map(term => term.trim()).filter(term => term)
      
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 200)

      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: selectedLocations,
          terms: terms,
          searchContent: true,
          deepSearch: deepSearch
        })
      })

      clearInterval(progressInterval)
      setSearchProgress(100)

      const data = await response.json()
      if (data.success) {
        setSearchResults(data.results)
        setSearchStats(data.stats)
        updateStatus(`Found ${data.results.length} files`)
        setTimeout(() => setCurrentStatus(''), 3000)
      }
    } catch (error) {
      console.error('Error searching files:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => setSearchProgress(0), 2000)
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
    updateStatus(`Formatting ${selectedFiles.length} files...`)
    
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
        updateStatus('Content formatted!')
        setTimeout(() => setCurrentStatus(''), 2000)
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
      setCopySuccess(true)
      updateStatus('Copied to clipboard!')
      setTimeout(() => {
        setCopySuccess(false)
        setCurrentStatus('')
      }, 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'cloud':
        return <Cloud className="h-4 w-4 text-yellow-400" />
      case 'external':
        return <ExternalLink className="h-4 w-4 text-green-400" />
      default:
        return <HardDrive className="h-4 w-4 text-gray-400" />
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
              <div className="grid grid-cols-3 gap-0.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-gray-900 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter search terms..."
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-300" />
            </div>
            <span className="text-sm text-gray-300">K3SS Search</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Search</h2>
              <h3 className="text-lg text-gray-300">Overview</h3>
            </div>
            
            <nav className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded bg-gray-700">
                <Home className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">Dashboard</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Storage</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Results</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Settings</span>
              </div>
            </nav>

            {/* Storage Locations */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Storage Locations</h4>
              <div className="space-y-2">
                {storageLocations.slice(0, 4).map((location, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
                    <Checkbox
                      checked={selectedLocations.includes(location.path)}
                      onCheckedChange={() => location.accessible && handleLocationToggle(location.path)}
                      disabled={!location.accessible}
                      className="border-gray-500"
                    />
                    {getLocationIcon(location.type)}
                    <span className="text-xs text-gray-300 truncate">{location.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Options</h4>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={deepSearch}
                  onCheckedChange={setDeepSearch}
                  className="data-[state=checked]:bg-yellow-400"
                />
                <Label className="text-xs text-gray-300">Deep Search</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Status Bar */}
          {currentStatus && (
            <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2">
                {isLoading || isDiscovering ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                ) : copySuccess ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Activity className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-sm text-gray-300">{currentStatus}</span>
                {searchProgress > 0 && searchProgress < 100 && (
                  <div className="ml-auto flex items-center gap-2">
                    <Progress value={searchProgress} className="w-24 h-2" />
                    <span className="text-xs text-gray-400">{Math.round(searchProgress)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Search Stats Cards */}
            {searchStats && (
              <>
                <Card className="col-span-3 bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{searchStats.total_files_scanned}</div>
                      <div className="text-xs text-gray-400">Files Scanned</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3 bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{searchStats.matching_files}</div>
                      <div className="text-xs text-gray-400">Matches Found</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3 bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{selectedFiles.length}</div>
                      <div className="text-xs text-gray-400">Selected</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3 bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{searchStats.search_terms.length}</div>
                      <div className="text-xs text-gray-400">Search Terms</div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Central Search Results Area */}
            <Card className="col-span-8 bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Search Results</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSearch} 
                      disabled={!selectedLocations.length || !searchTerms.trim() || isLoading}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                    {searchResults.length > 0 && (
                      <Button variant="outline" onClick={handleSelectAll} size="sm" className="border-gray-600 text-gray-300">
                        {selectedFiles.length === searchResults.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No search results yet</p>
                    <p className="text-sm text-gray-500 mt-1">Enter search terms and click search to begin</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {searchResults.map((file, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                          <Checkbox
                            checked={selectedFiles.includes(index)}
                            onCheckedChange={() => handleFileToggle(index)}
                            className="mt-1 border-gray-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-white truncate">{file.name}</span>
                              <Badge variant="secondary" className="bg-gray-600 text-gray-300">{file.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-400 truncate">{file.path}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{formatFileSize(file.size)}</span>
                              <span>{new Date(file.modified).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {file.matches.map((match, matchIndex) => (
                                <Badge key={matchIndex} className="text-xs bg-yellow-400 text-gray-900">
                                  {match}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Action Panel */}
            <Card className="col-span-4 bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleFormatForLLM}
                  disabled={!selectedFiles.length || isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Format for LLM ({selectedFiles.length})
                </Button>
                
                {showFormatted && (
                  <Button 
                    onClick={() => copyToClipboard(formattedContent)}
                    className={`w-full ${copySuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={discoverStorageLocations}
                  disabled={isDiscovering}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
                  Refresh Storage
                </Button>
              </CardContent>
            </Card>

            {/* Formatted Content */}
            {showFormatted && formattedContent && (
              <Card className="col-span-12 bg-gray-800 border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    LLM-Formatted Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formattedContent}
                    readOnly
                    className="min-h-64 font-mono text-sm bg-gray-900 border-gray-600 text-gray-300"
                    placeholder="Formatted content will appear here..."
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

