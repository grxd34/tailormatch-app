import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { requestsAPI } from '../services/api';
import { TailoringRequest } from '../types';
import Chat from '../components/Chat';
import ReviewForm from '../components/ReviewForm';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import toast from 'react-hot-toast';

const Requests: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<TailoringRequest | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [requestToDelete, setRequestToDelete] = useState<TailoringRequest | null>(null);
  const navigate = useNavigate();
  const { unreadCounts, totalUnreadCount } = useUnreadMessages();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error, refetch } = useQuery(
    'my-requests',
    requestsAPI.getMy,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const deleteRequestMutation = useMutation(requestsAPI.delete, {
    onSuccess: () => {
      toast.success('Request deleted successfully');
      queryClient.invalidateQueries('my-requests');
      setShowDeleteDialog(false);
      setRequestToDelete(null);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete request');
    },
  });

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

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    refetch(); // Refresh requests to show updated data
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest || !cancelReason.trim()) return;
    
    setIsCancelling(true);
    try {
      await requestsAPI.cancel(selectedRequest.id, cancelReason.trim());
      toast.success('Request cancelled successfully');
      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedRequest(null);
      refetch(); // Refresh requests to show updated data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelRequest = (request: TailoringRequest) => {
    // Allow cancellation of pending and accepted requests only
    return request.status === 'pending' || request.status === 'accepted';
  };

  const handleDeleteRequest = (request: TailoringRequest) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRequest = () => {
    if (requestToDelete) {
      deleteRequestMutation.mutate(requestToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load requests. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          {totalUnreadCount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalUnreadCount}</div>
              <div className="text-sm text-gray-600">Unread Messages</div>
            </div>
          )}
        </div>
        
        {requests && requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-600 mb-4">Create your first tailoring request to get started.</p>
            <button 
              onClick={() => navigate('/create-request')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests?.map((request) => {
              const unreadCount = getUnreadCountForRequest(request.id);
              return (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    unreadCount > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.tailor_details.shop_name}
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
                      
                      {request.estimated_completion && (
                        <p className="mt-2 text-sm text-gray-500">
                          Estimated completion: {new Date(request.estimated_completion).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-1">⭐</span>
                          {request.tailor_details.rating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.tailor_details.total_reviews} reviews
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-xs font-medium">New messages</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(request);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="Delete request"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Request Details
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
                {/* Tailor Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tailor Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedRequest.tailor_details.shop_name}</h4>
                        <p className="text-sm text-gray-600">{selectedRequest.tailor_details.bio}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-sm text-gray-600 mr-4">
                            ⭐ {selectedRequest.tailor_details.rating.toFixed(1)} ({selectedRequest.tailor_details.total_reviews} reviews)
                          </span>
                          <span className="text-sm text-gray-600">
                            📍 {selectedRequest.tailor_details.address}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusText(selectedRequest.status)}
                    </span>
                    {selectedRequest.estimated_completion && (
                      <span className="text-sm text-gray-600">
                        Estimated completion: {new Date(selectedRequest.estimated_completion).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Measurements */}
                {Object.keys(selectedRequest.decrypted_measurements).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Measurements</h3>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Request created on {new Date(selectedRequest.created_at).toLocaleString()}
                      </span>
                    </div>
                    {selectedRequest.updated_at !== selectedRequest.created_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          Last updated on {new Date(selectedRequest.updated_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancel Request Button */}
                {canCancelRequest(selectedRequest) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 mb-4">
                        {selectedRequest.status === 'accepted' 
                          ? 'Need to cancel this accepted request? Please provide a reason as the tailor has already started working on your request.'
                          : 'Need to cancel this request? This action cannot be undone.'
                        }
                      </p>
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Status-specific messages for non-cancellable requests */}
                {!canCancelRequest(selectedRequest) && selectedRequest.status === 'rejected' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Status</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">
                        This request has been rejected by the tailor. You cannot cancel a request that has already been rejected.
                      </p>
                    </div>
                  </div>
                )}

                {!canCancelRequest(selectedRequest) && selectedRequest.status === 'in_progress' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Status</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">
                        This request is currently being worked on by the tailor. 
                        You cannot cancel it at this stage. Please contact the tailor directly if you need assistance.
                      </p>
                    </div>
                  </div>
                )}

                {!canCancelRequest(selectedRequest) && selectedRequest.status === 'ready_for_fitting' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Status</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">
                        This request is ready for fitting. 
                        You cannot cancel it at this stage. Please contact the tailor directly if you need assistance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Section for Completed Requests */}
                {selectedRequest.status === 'completed' && !selectedRequest.review && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Your Experience</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 mb-4">
                        Your tailoring request has been completed! How was your experience with {selectedRequest.tailor_details.shop_name}?
                      </p>
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Rate This Tailor
                      </button>
                    </div>
                  </div>
                )}

                {/* Show existing review if it exists */}
                {selectedRequest.status === 'completed' && selectedRequest.review && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Review</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < (selectedRequest.review?.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-sm font-medium text-gray-700 ml-2">
                          {selectedRequest.review?.rating ?? 0} star{(selectedRequest.review?.rating ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {selectedRequest.review?.comment && (
                        <p className="text-gray-700 text-sm">
                          "{selectedRequest.review.comment}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Reviewed on {selectedRequest.review?.created_at ? new Date(selectedRequest.review.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Chat */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication</h3>
                  <Chat 
                    requestId={selectedRequest.id}
                    tailorName={selectedRequest.tailor_details.shop_name}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedRequest && (
        <ReviewForm
          requestId={selectedRequest.id}
          tailorName={selectedRequest.tailor_details.shop_name}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Request</h3>
            <p className="text-gray-600 mb-4">
              {selectedRequest.status === 'accepted' 
                ? `Are you sure you want to cancel your accepted request to ${selectedRequest.tailor_details.shop_name}? The tailor has already started working on your request, so please provide a clear reason for cancellation.`
                : `Are you sure you want to cancel your request to ${selectedRequest.tailor_details.shop_name}? This action cannot be undone and will notify the tailor.`
              }
            </p>
            
            <div className="mb-6">
              <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (required)
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel this request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                disabled={isCancelling}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={isCancelling}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && requestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Request</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete your request to {requestToDelete.tailor_details.shop_name}? 
              This action cannot be undone and will permanently remove all associated data including messages and notifications.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setRequestToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={deleteRequestMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRequest}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deleteRequestMutation.isLoading}
              >
                {deleteRequestMutation.isLoading ? 'Deleting...' : 'Delete Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;