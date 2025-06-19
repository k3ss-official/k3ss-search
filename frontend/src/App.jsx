import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
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
  Loader2,
  HardDrive,
  Cloud,
  ExternalLink,
  RefreshCw,
  Check,
  BarChart3,
  Zap,
  User,
  Settings,
  Home,
  Database,
  Bell
} from 'lucide-react'
import './App.css'

const API_BASE_URL = 'http://localhost:5010/api'

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-700 text-white overflow-hidden">
      {/* Top Header - Minimal like the fleet dashboard */}
      <div className="bg-gray-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
            <div className="grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-gray-900 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-gray-300" />
          <div className="flex items-center gap-2 bg-gray-500 px-3 py-1 rounded">
            <User className="h-4 w-4 text-gray-300" />
            <span className="text-sm text-gray-300">K3SS</span>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar - Like Fleet Overview */}
        <div className="w-64 bg-gray-600 p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Search</h1>
            <h2 className="text-xl text-gray-300">Overview</h2>
          </div>
          
          <nav className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-2 rounded bg-gray-500">
              <Home className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-500 cursor-pointer">
              <Database className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-500 cursor-pointer">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-500 cursor-pointer">
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-500 cursor-pointer">
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
          </nav>

          {/* Search Configuration Panel */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Search Terms</label>
              <Input
                placeholder="Enter terms..."
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-gray-500 border-gray-400 text-white placeholder-gray-300 text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={deepSearch}
                onCheckedChange={setDeepSearch}
                className="data-[state=checked]:bg-yellow-400"
              />
              <label className="text-xs text-gray-300">Deep Search</label>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={!selectedLocations.length || !searchTerms.trim() || isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 relative bg-gray-700 p-6">
          {/* Floating Metric Cards - Positioned like in fleet dashboard */}
          {searchStats && (
            <>
              {/* Top Left */}
              <Card className="absolute top-6 left-6 w-32 bg-gray-600 border-gray-500">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-yellow-400">{searchStats.total_files_scanned}</div>
                  <div className="text-xs text-gray-300">Files Scanned</div>
                </CardContent>
              </Card>

              {/* Top Right */}
              <Card className="absolute top-6 right-6 w-40 bg-gray-600 border-gray-500">
                <CardContent className="p-3">
                  <div className="text-xs text-gray-300 mb-1">Search Status</div>
                  <div className="text-sm font-medium text-white">
                    {isLoading ? 'Searching...' : searchResults.length > 0 ? 'Complete' : 'Ready'}
                  </div>
                  {searchStats.deep_search_enabled && (
                    <Badge className="mt-1 bg-yellow-400 text-gray-900 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Deep
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Bottom Left */}
              <Card className="absolute bottom-32 left-6 w-36 bg-gray-600 border-gray-500">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{searchStats.matching_files}</div>
                  <div className="text-xs text-gray-300">Matches Found</div>
                </CardContent>
              </Card>

              {/* Bottom Right */}
              <Card className="absolute bottom-32 right-6 w-32 bg-gray-600 border-gray-500">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{selectedFiles.length}</div>
                  <div className="text-xs text-gray-300">Selected</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Central Search Results Area - Replacing the vehicle */}
          <div className="absolute inset-0 flex items-center justify-center p-20">
            <div className="w-full max-w-4xl h-full">
              {searchResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-24 w-24 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-medium text-gray-300 mb-2">No Search Results</h3>
                    <p className="text-gray-400">Configure search terms and locations to begin</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-600 rounded-lg p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Search Results ({searchResults.length})</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSelectAll} size="sm" className="border-gray-400 text-gray-300">
                        {selectedFiles.length === searchResults.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button 
                        onClick={handleFormatForLLM}
                        disabled={!selectedFiles.length || isLoading}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Format ({selectedFiles.length})
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {searchResults.map((file, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded bg-gray-500 hover:bg-gray-400 transition-colors">
                          <Checkbox
                            checked={selectedFiles.includes(index)}
                            onCheckedChange={() => handleFileToggle(index)}
                            className="mt-1 border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-white truncate">{file.name}</span>
                              <Badge className="bg-gray-700 text-gray-300">{file.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-300 truncate">{file.path}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
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
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar - Bottom center like in fleet dashboard */}
          {searchProgress > 0 && searchProgress < 100 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-64">
              <div className="bg-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300">Searching...</span>
                  <span className="text-xs text-gray-300">{Math.round(searchProgress)}%</span>
                </div>
                <Progress value={searchProgress} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Storage Locations */}
        <div className="w-80 bg-gray-600 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Storage Locations</h3>
              <Button
                onClick={discoverStorageLocations}
                disabled={isDiscovering}
                variant="outline"
                size="sm"
                className="border-gray-400 text-gray-300"
              >
                <RefreshCw className={`h-4 w-4 ${isDiscovering ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {storageLocations.map((location, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-gray-500 cursor-pointer">
                  <Checkbox
                    checked={selectedLocations.includes(location.path)}
                    onCheckedChange={() => location.accessible && handleLocationToggle(location.path)}
                    disabled={!location.accessible}
                    className="border-gray-400"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {location.type === 'cloud' ? (
                      <Cloud className="h-4 w-4 text-yellow-400" />
                    ) : location.type === 'external' ? (
                      <ExternalLink className="h-4 w-4 text-green-400" />
                    ) : (
                      <HardDrive className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{location.name}</div>
                      <div className="text-xs text-gray-400 truncate">{location.path}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
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
          </div>

          {/* Status Display */}
          {currentStatus && (
            <div className="mt-6 p-3 bg-gray-500 rounded">
              <div className="flex items-center gap-2">
                {isLoading || isDiscovering ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                ) : copySuccess ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : null}
                <span className="text-sm text-gray-300">{currentStatus}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formatted Content Modal/Overlay */}
      {showFormatted && formattedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">LLM-Formatted Content</h3>
              <Button 
                onClick={() => setShowFormatted(false)}
                variant="outline"
                size="sm"
                className="border-gray-400 text-gray-300"
              >
                Close
              </Button>
            </div>
            <Textarea
              value={formattedContent}
              readOnly
              className="w-full h-96 font-mono text-sm bg-gray-700 border-gray-500 text-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App

