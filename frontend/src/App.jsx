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
  Bell,
  Square,
  Play,
  Pause
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
  const [searchController, setSearchController] = useState(null)

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

  const stopSearch = () => {
    if (searchController) {
      searchController.abort()
      setSearchController(null)
    }
    setIsLoading(false)
    setSearchProgress(0)
    updateStatus('Search stopped')
    setTimeout(() => setCurrentStatus(''), 2000)
  }

  const handleSearch = async () => {
    if (!selectedLocations.length || !searchTerms.trim()) return

    const controller = new AbortController()
    setSearchController(controller)
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
        }),
        signal: controller.signal
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
      if (error.name === 'AbortError') {
        console.log('Search was aborted')
      } else {
        console.error('Error searching files:', error)
      }
    } finally {
      setIsLoading(false)
      setSearchController(null)
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
    <div className="min-h-screen bg-slate-600 text-white overflow-hidden">
      {/* Top Header - Exactly like fleet dashboard */}
      <div className="bg-slate-500 px-6 py-3 flex items-center justify-between border-b border-slate-400">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
            <div className="grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-slate-900 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              placeholder="Search locations..."
              className="pl-10 bg-slate-400 border-slate-300 text-white placeholder-slate-200"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-slate-300" />
          <div className="flex items-center gap-2 bg-slate-400 px-3 py-1 rounded">
            <User className="h-4 w-4 text-slate-200" />
            <span className="text-sm text-slate-200">K3SS</span>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar - Exactly like Fleet Overview */}
        <div className="w-64 bg-slate-600 p-6 border-r border-slate-500">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Search</h1>
            <h2 className="text-xl text-slate-300">Overview</h2>
          </div>
          
          <nav className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 rounded bg-slate-500">
              <Home className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded hover:bg-slate-500 cursor-pointer">
              <Database className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded hover:bg-slate-500 cursor-pointer">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded hover:bg-slate-500 cursor-pointer">
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded hover:bg-slate-500 cursor-pointer">
              <Settings className="h-5 w-5 text-slate-400" />
            </div>
          </nav>
        </div>

        {/* Main Dashboard Area - Exactly like fleet dashboard layout */}
        <div className="flex-1 relative bg-slate-600 p-6">
          {/* Floating Metric Cards - Positioned exactly like in fleet dashboard */}
          {searchStats && (
            <>
              {/* Top Left - Files Scanned */}
              <Card className="absolute top-6 left-6 w-40 bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-300 mb-1">Files Scanned</div>
                  <div className="text-2xl font-bold text-yellow-400">{searchStats.total_files_scanned}</div>
                  <div className="text-xs text-slate-400">Total processed</div>
                </CardContent>
              </Card>

              {/* Top Center - Performance Snapshot */}
              <Card className="absolute top-6 left-1/2 transform -translate-x-1/2 w-48 bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-300 mb-2">Performance Snapshot</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-300">Status</div>
                      <div className="text-lg font-bold text-green-400">
                        {isLoading ? 'Searching' : searchResults.length > 0 ? 'Complete' : 'Ready'}
                      </div>
                    </div>
                    {searchStats.deep_search_enabled && (
                      <div className="w-12 h-12 bg-yellow-400 rounded flex items-center justify-center">
                        <Zap className="h-6 w-6 text-slate-900" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Right - Search Terms */}
              <Card className="absolute top-6 right-6 w-40 bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-300 mb-1">Search Terms</div>
                  <div className="text-2xl font-bold text-blue-400">{searchStats.search_terms.length}</div>
                  <div className="text-xs text-slate-400">Active queries</div>
                </CardContent>
              </Card>

              {/* Bottom Left - Matches Found */}
              <Card className="absolute bottom-32 left-6 w-40 bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-300 mb-1">Matches Found</div>
                  <div className="text-2xl font-bold text-green-400">{searchStats.matching_files}</div>
                  <div className="text-xs text-slate-400">Results</div>
                </CardContent>
              </Card>

              {/* Bottom Right - Selected Files */}
              <Card className="absolute bottom-32 right-6 w-40 bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-300 mb-1">Selected</div>
                  <div className="text-2xl font-bold text-purple-400">{selectedFiles.length}</div>
                  <div className="text-xs text-slate-400">For export</div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Central Hero Area - Search Results replacing the vehicle */}
          <div className="absolute inset-0 flex items-center justify-center p-24">
            <div className="w-full max-w-5xl h-full flex flex-col">
              {searchResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-32 w-32 mx-auto text-slate-400 mb-6" />
                    <h3 className="text-2xl font-medium text-slate-300 mb-3">No Search Results</h3>
                    <p className="text-slate-400 mb-6">Configure search terms and locations to begin</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-500 rounded-lg p-6 h-full shadow-xl border border-slate-400">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-white">Search Results ({searchResults.length})</h3>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleSelectAll} size="sm" className="border-slate-300 text-slate-200 hover:bg-slate-400">
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
                        <div key={index} className="flex items-start space-x-3 p-4 rounded bg-slate-400 hover:bg-slate-300 transition-colors">
                          <Checkbox
                            checked={selectedFiles.includes(index)}
                            onCheckedChange={() => handleFileToggle(index)}
                            className="mt-1 border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-white truncate">{file.name}</span>
                              <Badge className="bg-slate-600 text-slate-200">{file.type}</Badge>
                            </div>
                            <p className="text-sm text-slate-200 truncate">{file.path}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-300 mt-1">
                              <span>{formatFileSize(file.size)}</span>
                              <span>{new Date(file.modified).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {file.matches.map((match, matchIndex) => (
                                <Badge key={matchIndex} className="text-xs bg-yellow-400 text-slate-900">
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

              {/* Search Controls - Under the hero section */}
              <div className="mt-6 bg-slate-500 rounded-lg p-4 shadow-lg border border-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter search terms (comma separated)..."
                      value={searchTerms}
                      onChange={(e) => setSearchTerms(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-slate-400 border-slate-300 text-white placeholder-slate-200"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={deepSearch}
                      onCheckedChange={setDeepSearch}
                      className="data-[state=checked]:bg-yellow-400"
                    />
                    <label className="text-sm text-slate-200">Deep Search</label>
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={!selectedLocations.length || !searchTerms.trim() || isLoading}
                    className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium px-6"
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
                  {isLoading && (
                    <Button 
                      onClick={stopSearch}
                      className="bg-red-600 hover:bg-red-700 text-white px-6"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar - Bottom center like in fleet dashboard */}
          {searchProgress > 0 && searchProgress < 100 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-80">
              <Card className="bg-slate-500 border-slate-400 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-200">Searching files...</span>
                    <span className="text-sm text-yellow-400 font-bold">{Math.round(searchProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-400 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${searchProgress}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Storage Locations */}
        <div className="w-80 bg-slate-600 p-6 border-l border-slate-500">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Storage Locations</h3>
              <Button
                onClick={discoverStorageLocations}
                disabled={isDiscovering}
                variant="outline"
                size="sm"
                className="border-slate-400 text-slate-300 hover:bg-slate-500"
              >
                <RefreshCw className={`h-4 w-4 ${isDiscovering ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {storageLocations.map((location, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded bg-slate-500 hover:bg-slate-400 cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedLocations.includes(location.path)}
                    onCheckedChange={() => location.accessible && handleLocationToggle(location.path)}
                    disabled={!location.accessible}
                    className="border-slate-300"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {location.type === 'cloud' ? (
                      <Cloud className="h-4 w-4 text-yellow-400" />
                    ) : location.type === 'external' ? (
                      <ExternalLink className="h-4 w-4 text-green-400" />
                    ) : (
                      <HardDrive className="h-4 w-4 text-slate-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{location.name}</div>
                      <div className="text-xs text-slate-300 truncate">{location.path}</div>
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
            <div className="mt-6 p-3 bg-slate-500 rounded border border-slate-400">
              <div className="flex items-center gap-2">
                {isLoading || isDiscovering ? (
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                ) : copySuccess ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : null}
                <span className="text-sm text-slate-200">{currentStatus}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formatted Content Modal */}
      {showFormatted && formattedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-500 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">LLM-Formatted Content</h3>
              <Button 
                onClick={() => setShowFormatted(false)}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-200 hover:bg-slate-400"
              >
                Close
              </Button>
            </div>
            <Textarea
              value={formattedContent}
              readOnly
              className="w-full h-96 font-mono text-sm bg-slate-600 border-slate-400 text-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App

