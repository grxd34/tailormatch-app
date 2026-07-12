import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { tailorAPI, requestsAPI } from '../services/api';
import { TailoringRequest } from '../types';
import Chat from '../components/Chat';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import toast from 'react-hot-toast';

const TailorRequests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<TailoringRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const { unreadCounts, totalUnreadCount, refreshUnreadCounts } = useUnreadMessages();
  const queryClient = useQueryClient();
  
  const { data: requests, isLoading, error, refetch } = useQuery(
    'tailor-requests',
    tailorAPI.getRequests,
    {
      onError: (error: any) => {
        console.error('Failed to load requests:', error);
        toast.error('Failed to load requests: ' + (error.response?.data?.detail || error.message));
      }
    }
  );

  console.log('TailorRequests - unreadCounts:', unreadCounts);
  console.log('TailorRequests - totalUnreadCount:', totalUnreadCount);
  console.log('TailorRequests - requests data:', requests);
  console.log('TailorRequests - isLoading:', isLoading);
  console.log('TailorRequests - error:', error);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      ready_for_fitting: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUnreadCountForRequest = (requestId: number) => {
    const requestCount = unreadCounts.find(count => count.requestId === requestId);
    return requestCount?.count || 0;
  };

  const handleRequestClick = (request: TailoringRequest) => {
    setSelectedRequest(request);
    // Mark messages as read immediately when chat is opened
    refreshUnreadCounts();
  };

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    try {
      await requestsAPI.updateStatus(requestId, { status: newStatus });
      toast.success('Request status updated');
      refetch();
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Status update error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to update status';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.status) {
          errorMessage = Array.isArray(errorData.status) ? errorData.status[0] : errorData.status;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };


  // Filter and sort requests
  const filteredRequests = requests?.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  ) || [];

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    accepted: requests?.filter(r => r.status === 'accepted').length || 0,
    in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
    ready_for_fitting: requests?.filter(r => r.status === 'ready_for_fitting').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
            <p className="text-gray-600">Manage and track all your tailoring requests</p>
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              to="/notifications"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
              </svg>
              <span>Notifications</span>
            </Link>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-3xl font-bold text-primary-600">{statusCounts.all}</div>
                  <div className="text-sm text-gray-600">Total Requests</div>
                </div>
                {totalUnreadCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{totalUnreadCount}</div>
                    <div className="text-sm text-gray-600">Unread Messages</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'all' ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">All</div>
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'pending' ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('pending')}
          >
            <div className="text-2xl font-bold text-yellow-800">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'accepted' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('accepted')}
          >
            <div className="text-2xl font-bold text-green-800">{statusCounts.accepted}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'in_progress' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('in_progress')}
          >
            <div className="text-2xl font-bold text-blue-800">{statusCounts.in_progress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'completed' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setStatusFilter('completed')}
          >
            <div className="text-2xl font-bold text-green-800">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="ready_for_fitting">Ready for Fitting</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'status')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {statusFilter === 'all' ? 'All Requests' : `${getStatusText(statusFilter)} Requests`}
            <span className="ml-2 text-sm font-normal text-gray-500">({sortedRequests.length})</span>
          </h2>
        </div>
        
        <div className="p-6">
          {sortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No requests yet' : `No ${getStatusText(statusFilter).toLowerCase()} requests`}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? "You'll receive tailoring requests from customers here."
                  : `No requests with ${getStatusText(statusFilter).toLowerCase()} status found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRequests.map((request) => {
                const unreadCount = getUnreadCountForRequest(request.id);
                return (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      unreadCount > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleRequestClick(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Request from {request.user.name}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Created {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                        </div>
                        
                        {request.notes && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {request.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span className="text-xs font-medium">New messages</span>
                          </div>
                        )}
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Request from {selectedRequest.user.name}
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedRequest.user.name}</h4>
                        <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                        {selectedRequest.user.phone && (
                          <p className="text-sm text-gray-600">{selectedRequest.user.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusText(selectedRequest.status)}
                    </span>
                  </div>
                </div>

                {/* Cancellation Reason - Only show for cancelled requests */}
                {selectedRequest.status === 'cancelled' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation Details</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800 mb-2">
                            This request was cancelled by the customer
                          </h4>
                          <p className="text-sm text-red-700">
                            <strong>Customer Reason:</strong> {selectedRequest.cancellation_reason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Measurements */}
                {Object.keys(selectedRequest.decrypted_measurements).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Measurements</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedRequest.decrypted_measurements).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-medium">{value} cm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedRequest.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedRequest.id, 'accepted')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept Request
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject Request
                        </button>
                      </>
                    )}
                    
                    {selectedRequest.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'in_progress')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    
                    {selectedRequest.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'ready_for_fitting')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Ready for Fitting
                      </button>
                    )}
                    
                    {selectedRequest.status === 'ready_for_fitting' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                  
                </div>

                {/* Chat */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication</h3>
                  <Chat 
                    requestId={selectedRequest.id}
                    customerName={selectedRequest.user.name}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TailorRequests;
