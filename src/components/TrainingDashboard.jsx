import React, { useState, useEffect } from 'react';
import './TrainingDashboard.css';
import { lmswebAPI } from '../api/api.js';
import VideoAssessmentModal from './VideoAssessmentModal.jsx';

const TrainingDashboard = () => {
    const [userModules, setUserModules] = useState([]);
    const [mandatoryTrainings, setMandatoryTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('assigned');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [videoWatchTime, setVideoWatchTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isVideoWatched, setIsVideoWatched] = useState(false);
    const [videoPlayer, setVideoPlayer] = useState(null);
    const [userData, setUserData] = useState(null);
    const [overallCompletion, setOverallCompletion] = useState(0);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [assessmentPassed, setAssessmentPassed] = useState(false);

    // ===== UNIFIED TRAINING LOADING =====
    // Load all trainings (assigned and mandatory) using the new unified API
    const loadUserTrainings = async (empID) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Loading all trainings using unified API for empID:', empID);
            
            // Clear any existing cache to ensure fresh data
            localStorage.removeItem('mandatoryTrainings');
            console.log('🗑️ Cleared mandatory trainings cache to ensure fresh data from API');
            
            // Use the new unified API
            const response = await lmswebAPI.getUserAllTrainings(empID);
            
            if (response && response.data) {
                console.log('✅ Unified API response:', response.data);
                
                const { assignedTrainings, mandatoryTrainings, allTrainings, userOverallCompletionPercentage, userRole } = response.data;
                
                // Set assigned trainings
                const transformedAssignedTrainings = assignedTrainings.map(training => ({
                        ...training,
                            modules: training.modules || [],
                    dueDate: training.dueDate || '2025-09-29'
                }));
                setUserModules(transformedAssignedTrainings);
                
                // Set mandatory trainings (no more localStorage dependency!)
                const transformedMandatoryTrainings = mandatoryTrainings.map(training => ({
                            ...training,
                    modules: training.modules || [],
                    dueDate: training.dueDate || '2025-09-29'
                }));
                setMandatoryTrainings(transformedMandatoryTrainings);
                
                // Set overall completion percentage and user data
                setOverallCompletion(parseFloat(userOverallCompletionPercentage) || 0);
                setUserData({
                    empID: response.data.user?.empID || empID,
                    role: userRole || 'No Role',
                    store: 'No Store'
                });
                
                console.log('✅ Successfully loaded:', {
                    assignedCount: assignedTrainings.length,
                    mandatoryCount: mandatoryTrainings.length,
                    overallCompletion: userOverallCompletionPercentage
                });
                
                } else {
                console.error('❌ Invalid response from unified API');
                setError('Failed to load trainings from unified API');
            }
        } catch (error) {
            console.error('❌ Error loading trainings from unified API:', error);
            setError('Error loading trainings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

        // ===== FETCH TRAINING DETAILS =====
    const fetchTrainingDetails = async (trainingId) => {
        try {
            console.log('🔍 Fetching training details for:', trainingId);
            
            // Get user ID for progress tracking
            let userId = null;
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    userId = user.mongoId || user._id;
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }
            
            // Use the correct user ID based on training type
            if (!userId) {
                if (selectedTraining && selectedTraining.type === 'Mandatory') {
                    userId = '68b2ecf6c8ad2931fc91b913';
            } else {
                    userId = '68b2ecf4c8ad2931fc91b8b6';
                }
            }
            
            const response = await lmswebAPI.getTrainingDetails(trainingId, userId);
            
            if (response && response.success && response.data) {
                console.log('✅ Training details:', response.data);
                return response.data;
                    } else {
                console.error('❌ Invalid training details response:', response);
                    return null;
                }
        } catch (error) {
            console.error('❌ Error fetching training details:', error);
            return null;
        }
    };

        // ===== MARK VIDEO AS COMPLETE =====
    const markVideoAsComplete = async (videoId, trainingId, moduleId) => {
        try {
            // Get user ID from localStorage or userData
            let userId = null;
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    userId = user.mongoId || user._id;
                    console.log('🔍 Found user ID from userData:', userId);
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }
            
            // If still no userId, try to get from the unified API response
            if (!userId && userData) {
                try {
                    const user = JSON.parse(userData);
                    userId = user.mongoId || user._id;
                    console.log('🔍 Using user ID from userData:', userId);
                } catch (e) {
                    console.error('Error parsing userData for fallback:', e);
                }
            }
            
            // Use the correct user ID based on training type
            if (!userId) {
                // Check if this is a mandatory training by looking at the selectedTraining
                if (selectedTraining && selectedTraining.type === 'Mandatory') {
                    userId = '68b2ecf6c8ad2931fc91b913'; // Use the correct user ID for mandatory trainings
                    console.log('🔍 Using mandatory training user ID:', userId);
                } else {
                    userId = '68b2ecf4c8ad2931fc91b8b6'; // Use the user ID for assigned trainings
                    console.log('🔍 Using assigned training user ID:', userId);
                }
            }
            
            console.log('✅ Marking video as complete:', { videoId, trainingId, moduleId, userId });
            
            const response = await lmswebAPI.markVideoAsComplete(videoId, trainingId, moduleId, userId);
            
            if (response && response.success) {
                console.log('✅ Video marked as complete successfully');
                
                // Update the current video completion status immediately
                if (selectedTraining && currentVideo) {
                    setSelectedTraining(prev => {
                        if (!prev) return prev;
                        
                        const updatedModules = prev.modules.map(module => {
                            const updatedVideos = module.videos.map(video => {
                                if (video._id === currentVideo._id) {
                                    return { ...video, completed: true };
                                }
                                return video;
                            });
                            return { ...module, videos: updatedVideos };
                        });
                        
                        return { ...prev, modules: updatedModules };
                    });
                }
                
                // Also update the global training lists to maintain consistency
                setUserModules(prevModules => 
                    prevModules.map(training => {
                        if (training._id === trainingId) {
                            return {
                                ...training,
                                modules: training.modules.map(module => {
                                    if (module._id === moduleId) {
                                        return {
                                            ...module,
                                            videos: module.videos.map(video => {
                                                if (video._id === videoId) {
                                                    return { ...video, completed: true };
                                                }
                                                return video;
                                            })
                                        };
                                    }
                                    return module;
                                })
                            };
                        }
                        return training;
                    })
                );
                
                setMandatoryTrainings(prevMandatory => 
                    prevMandatory.map(training => {
                        if (training._id === trainingId) {
                            return {
                                ...training,
                                modules: training.modules.map(module => {
                                    if (module._id === moduleId) {
                                        return {
                                            ...module,
                                            videos: module.videos.map(video => {
                                                if (video._id === videoId) {
                                                    return { ...video, completed: true };
                                                }
                                                return video;
                                            })
                                        };
                                    }
                                    return module;
                                })
                            };
                        }
                        return training;
                    })
                );
                
                return true;
                } else {
                console.error('❌ Failed to mark video as complete:', response);
                return false;
            }
        } catch (error) {
            console.error('❌ Error marking video as complete:', error);
            return false;
        }
    };

    // ===== CHECK IF VIDEO CAN BE WATCHED =====
    const canWatchVideo = (video, module) => {
        if (!module || !module.videos) return true;
        
        const videoIndex = module.videos.findIndex(v => v._id === video._id);
        if (videoIndex === 0) return true; // First video is always available
        
        // Check if previous video is completed
        const previousVideo = module.videos[videoIndex - 1];
        const canWatch = previousVideo && previousVideo.completed;
        
        console.log('🔍 Video unlocking check:', {
            videoTitle: video.title,
            videoIndex: videoIndex,
            previousVideoTitle: previousVideo?.title,
            previousVideoCompleted: previousVideo?.completed,
            canWatch: canWatch
        });
        
        return canWatch;
    };

    // ===== CHECK IF VIDEO CAN BE MARKED COMPLETE =====
    const canMarkVideoComplete = (video, module) => {
        if (!module || !module.videos) return false;
        
        const videoIndex = module.videos.findIndex(v => v._id === video._id);
        if (videoIndex === 0) {
            // First video can be completed if it's watched
            return true;
        }
        
        // Check if previous video is completed
        const previousVideo = module.videos[videoIndex - 1];
        const previousVideoCompleted = previousVideo && previousVideo.completed;
        
        // For videos in the list (not currently open), only check if previous is completed
        // The "Mark Complete" button will only be shown for the currently open video
        const canComplete = previousVideoCompleted;
        
        console.log('🔍 Video completion check:', {
            videoTitle: video.title,
            videoIndex: videoIndex,
            previousVideoTitle: previousVideo?.title,
            previousVideoCompleted: previousVideoCompleted,
            canComplete: canComplete
        });
        
        return canComplete;
    };

    // ===== CHECK IF MODULE CAN BE WATCHED =====
    const canWatchModule = (module, moduleIndex) => {
        if (moduleIndex === 0) return true; // First module is always available
        
        // Check if previous module is completed (all videos in previous module are completed)
        const previousModule = selectedTraining?.modules?.[moduleIndex - 1];
        if (!previousModule || !previousModule.videos) return false;
        
        const allVideosCompleted = previousModule.videos.every(video => video.completed);
        
        console.log('🔍 Module unlocking check:', {
            moduleName: module.name,
            moduleIndex: moduleIndex,
            previousModuleName: previousModule?.name,
            previousModuleVideos: previousModule?.videos?.length,
            allVideosCompleted: allVideosCompleted,
            canWatch: allVideosCompleted
        });
        
        return allVideosCompleted;
    };

    // ===== WATCH VIDEO =====
    const watchVideo = (video) => {
        console.log('🎥 Opening video:', video);
        console.log('🎥 Video URL:', video.videoUrl);
        console.log('🎥 Video Title:', video.title);
        console.log('🎥 Video ID:', video._id);
        
        // Check if video can be watched
        const currentModule = selectedTraining?.modules?.find(m => 
            m.videos?.find(v => v._id === video._id)
        );
        
        if (!canWatchVideo(video, currentModule)) {
            console.log('❌ Video is locked, cannot watch');
            alert('Please complete the previous video first.');
            return;
        }
        
        // Check if this video has assessment questions
        let hasAssessment = false;
        if (selectedTraining && selectedTraining.modules) {
            for (const module of selectedTraining.modules) {
                if (module.videos) {
                    const moduleVideo = module.videos.find(v => v._id === video._id);
                    if (moduleVideo && moduleVideo.questions && moduleVideo.questions.length > 0) {
                        hasAssessment = true;
                        console.log('📝 Video has assessment questions:', moduleVideo.questions.length);
                        break;
                    }
                }
            }
        }
        
        console.log('🔍 Video assessment check:', { hasAssessment, videoId: video._id });
        
        // Add trainingId to video object for completion
        const videoWithTrainingId = {
            ...video,
            trainingId: selectedTraining?._id
        };
        
        // Reset video watching state for new video
        setIsVideoWatched(false);
        setVideoWatchTime(0);
        setVideoDuration(0);
        
        setCurrentVideo(videoWithTrainingId);
        setShowVideoModal(true);
    };

    // ===== TOGGLE MODULE EXPANSION =====
    const toggleModuleExpansion = (moduleId) => {
        setSelectedTraining(prev => {
            if (!prev) return null;
            
            const updatedModules = prev.modules.map(module => {
                if (module._id === moduleId) {
                    return { ...module, expanded: !module.expanded };
                }
                return module;
            });
            
            return { ...prev, modules: updatedModules };
        });
    };

    // ===== SWITCH TAB =====
    const switchTab = (tab) => {
        setActiveTab(tab);
        setSelectedTraining(null);
    };

    // ===== OPEN TRAINING DETAILS =====
    const openTrainingDetails = async (training) => {
        try {
            console.log('📋 Opening training details:', training);
            
            // Fetch detailed training information
            const trainingDetails = await fetchTrainingDetails(training.trainingId);
            
            if (trainingDetails) {
                // Set modules as expanded by default so videos are visible
                const modulesWithExpanded = (trainingDetails.modules || []).map(module => ({
                    ...module,
                    expanded: true // Expand all modules by default
                }));
                
                console.log('📋 Training details modules:', modulesWithExpanded);
                
                // Log assessment information for debugging
                modulesWithExpanded.forEach((module, moduleIndex) => {
                    if (module.videos) {
                        module.videos.forEach((video, videoIndex) => {
                            if (video.questions && video.questions.length > 0) {
                                console.log(`📝 Module ${moduleIndex + 1}, Video ${videoIndex + 1} has ${video.questions.length} assessment questions`);
                            }
                        });
                    }
                });
                
                setSelectedTraining({
                    ...training,
                    ...trainingDetails,
                    modules: modulesWithExpanded
                });
                setShowModal(true);
            } else {
                console.error('❌ Could not fetch training details');
                alert('Could not load training details. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error opening training details:', error);
            alert('Error loading training details. Please try again.');
        }
    };

    // ===== YOUTUBE VIDEO TRACKING FUNCTIONS =====
    
    // Extract YouTube video ID from URL
    const extractYouTubeVideoId = (url) => {
        console.log('🔍 Extracting video ID from URL:', url);
        
        // Handle different YouTube URL formats
        let videoId = null;
        
        // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
        if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1];
        }
        // Regular YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
        else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1];
        }
        // YouTube short URL: https://youtu.be/VIDEO_ID
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1];
        }
        
        // Remove any additional parameters
        if (videoId && videoId.includes('&')) {
            videoId = videoId.split('&')[0];
        }
        
        // Remove any query parameters
        if (videoId && videoId.includes('?')) {
            videoId = videoId.split('?')[0];
        }
        
        console.log('🔍 Extracted video ID:', videoId);
        console.log('🔍 Video ID length:', videoId ? videoId.length : 0);
        
        // Return video ID if it's valid (11 characters for YouTube)
        return (videoId && videoId.length === 11) ? videoId : null;
    };

    // Initialize YouTube iframe API
    useEffect(() => {
        console.log('🎬 Checking YouTube API availability...');
        console.log('🎬 window.YT exists:', !!window.YT);
        console.log('🎬 window.YT.Player exists:', !!(window.YT && window.YT.Player));
        
        if (window.YT && window.YT.Player) {
            console.log('✅ YouTube API already loaded');
            return;
        }

        console.log('🎬 Loading YouTube iframe API...');
        // Load YouTube iframe API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            console.log('✅ YouTube iframe API ready');
        };
    }, []);

    // Initialize video player when modal opens
    useEffect(() => {
        if (showVideoModal && currentVideo && currentVideo.videoUrl) {
            console.log('🎬 Initializing video player...');
            console.log('🎬 Current video:', currentVideo);
            console.log('🎬 Video URL:', currentVideo.videoUrl);
            
            let videoId = extractYouTubeVideoId(currentVideo.videoUrl);
            console.log('🎬 Extracted video ID from embed URL:', videoId);
            
            // If embed URL fails, try original URL
            if (!videoId && currentVideo.originalUrl) {
                videoId = extractYouTubeVideoId(currentVideo.originalUrl);
                console.log('🎬 Extracted video ID from original URL:', videoId);
            }
            
            console.log('🎬 Final video ID:', videoId);
            console.log('🎬 YouTube API available:', !!(window.YT && window.YT.Player));
            
            // Show fallback after 5 seconds if video doesn't load
            const fallbackTimeout = setTimeout(() => {
                const fallbackElement = document.getElementById('video-fallback');
                if (fallbackElement) {
                    fallbackElement.style.display = 'block';
                }
            }, 5000);
            
            if (videoId && window.YT && window.YT.Player) {
                console.log('🎬 Creating YouTube player...');
                const player = new window.YT.Player('youtube-player', {
                    height: '360',
                    width: '640',
                    videoId: videoId,
                    playerVars: {
                        'controls': 1,
                        'disablekb': 1, // Disable keyboard controls
                        'fs': 0, // Disable fullscreen
                        'rel': 0, // Don't show related videos
                        'showinfo': 0, // Don't show video info
                        'modestbranding': 1, // Minimal branding
                        'iv_load_policy': 3, // Don't show annotations
                        'cc_load_policy': 0, // Don't show captions
                        'playsinline': 1, // Play inline on mobile
                        'enablejsapi': 1, // Enable JavaScript API
                        'origin': window.location.origin
                    },
                    events: {
                        'onReady': (event) => {
                            console.log('🎬 Video player ready');
                            setVideoPlayer(event.target);
                            setVideoDuration(event.target.getDuration());
                            // Clear the fallback timeout since player loaded successfully
                            clearTimeout(fallbackTimeout);
                        },
                        'onStateChange': (event) => {
                            const state = event.data;
                            if (state === window.YT.PlayerState.PLAYING) {
                                console.log('▶️ Video started playing');
                            } else if (state === window.YT.PlayerState.PAUSED) {
                                console.log('⏸️ Video paused');
                            } else if (state === window.YT.PlayerState.ENDED) {
                                console.log('✅ Video ended - marking as watched');
                                setIsVideoWatched(true);
                                setVideoWatchTime(videoDuration);
                            }
                        },
                        'onError': (event) => {
                            console.error('❌ Video player error:', event.data);
                        }
                    }
                });
            }
        }

        return () => {
            if (videoPlayer) {
                videoPlayer.destroy();
                setVideoPlayer(null);
            }
        };
    }, [showVideoModal, currentVideo]);

    // Update watch time periodically
    useEffect(() => {
        if (!videoPlayer) return;

        const interval = setInterval(() => {
            if (videoPlayer && videoPlayer.getCurrentTime) {
                const currentTime = videoPlayer.getCurrentTime();
                setVideoWatchTime(currentTime);
                
                // Check if video is fully watched (95% or more)
                const watchPercentage = (currentTime / videoDuration) * 100;
                if (watchPercentage >= 95) {
                    setIsVideoWatched(true);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [videoPlayer, videoDuration]);

    // ===== COMPLETE VIDEO =====
    const completeVideo = async () => {
        if (!currentVideo) return;
        
        // Only allow completion if video is fully watched
        if (!isVideoWatched) {
            alert('Please watch the complete video before marking it as complete. You must watch at least 95% of the video.');
            return;
        }
        
        // Check if video can be completed based on previous video completion
        const currentModule = selectedTraining?.modules?.find(m => 
            m.videos?.find(v => v._id === currentVideo._id)
        );
        
        if (!canMarkVideoComplete(currentVideo, currentModule)) {
            alert('Please complete the previous video first.');
            return;
        }
        
        // Check if video has assessment questions using the assessment API
        try {
            console.log('🔍 Checking for assessment questions for video:', currentVideo._id);
            console.log('🔍 Video title:', currentVideo.title);
            console.log('🔍 Full video object:', currentVideo);
            
            const assessmentResponse = await lmswebAPI.getVideoAssessment(currentVideo._id);
            
            if (assessmentResponse && assessmentResponse.success && assessmentResponse.data && assessmentResponse.data.questions && assessmentResponse.data.questions.length > 0) {
                console.log('📝 Video has assessment questions:', assessmentResponse.data.questions.length);
                setShowAssessmentModal(true);
                return;
            } else {
                console.log('✅ No assessment questions found, proceeding with normal completion');
                await markVideoAsCompleteAndClose();
            }
        } catch (error) {
            console.log('❌ Error checking assessment questions:', error);
            console.log('❌ Error details:', error.message);
            
            // Try to find the correct video ID by searching through modules
            console.log('🔍 Trying to find correct video ID...');
            let foundVideoId = null;
            
            if (selectedTraining && selectedTraining.modules) {
                for (const module of selectedTraining.modules) {
                    if (module.videos) {
                        const matchingVideo = module.videos.find(v => 
                            v.title === currentVideo.title || 
                            v.videoUri === currentVideo.videoUrl ||
                            v.videoUri === currentVideo.videoUri
                        );
                        if (matchingVideo) {
                            foundVideoId = matchingVideo._id;
                            console.log('🔍 Found matching video with ID:', foundVideoId);
                            break;
                        }
                    }
                }
            }
            
            if (foundVideoId && foundVideoId !== currentVideo._id) {
                console.log('🔍 Trying with corrected video ID:', foundVideoId);
                try {
                    const correctedResponse = await lmswebAPI.getVideoAssessment(foundVideoId);
                    if (correctedResponse && correctedResponse.success && correctedResponse.data && correctedResponse.data.questions && correctedResponse.data.questions.length > 0) {
                        console.log('📝 Video has assessment questions (with corrected ID):', correctedResponse.data.questions.length);
                        // Update the current video with the correct ID
                        setCurrentVideo(prev => ({ ...prev, _id: foundVideoId }));
                        setShowAssessmentModal(true);
                        return;
                    }
                } catch (correctedError) {
                    console.log('❌ Corrected video ID also failed:', correctedError.message);
                }
            }
            
            // If there's an error checking assessment, assume no assessment and proceed
            await markVideoAsCompleteAndClose();
        }
    };

    // ===== MARK VIDEO AS COMPLETE AND CLOSE =====
    const markVideoAsCompleteAndClose = async () => {
        if (!currentVideo) return;
        
        // Find the module that contains this video
        let moduleId = null;
        if (selectedTraining && selectedTraining.modules) {
            for (const module of selectedTraining.modules) {
                if (module.videos && module.videos.find(v => v._id === currentVideo._id)) {
                    moduleId = module._id;
                    break;
                }
            }
        }
        
        if (!moduleId) {
            console.error('❌ Could not find module for video:', currentVideo._id);
            alert('Error: Could not find module for this video.');
            return;
        }
        
        try {
            console.log('🎬 Completing video:', currentVideo.title);
            console.log('📊 Watch time:', videoWatchTime, '/', videoDuration);
            
            const success = await markVideoAsComplete(
                currentVideo._id, 
                currentVideo.trainingId, 
                moduleId,
                videoWatchTime,
                videoDuration
            );
            
            if (success) {
                console.log('✅ Video completed successfully');
                setShowVideoModal(false);
                setCurrentVideo(null);
                setVideoWatchTime(0);
                setVideoDuration(0);
                setIsVideoWatched(false);
                setVideoPlayer(null);
                setShowAssessmentModal(false);
                setAssessmentPassed(false);
                alert('Video completed successfully!');
            } else {
                alert('Failed to mark video as complete. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error completing video:', error);
            alert('Error completing video. Please try again.');
        }
    };

    // ===== HANDLE ASSESSMENT COMPLETION =====
    const handleAssessmentComplete = async (assessmentResults) => {
        console.log('📝 Assessment completed:', assessmentResults);
        
        if (assessmentResults.passed) {
            setAssessmentPassed(true);
            console.log('✅ Assessment passed, proceeding with video completion');
            await markVideoAsCompleteAndClose();
        } else {
            console.log('❌ Assessment failed, user needs to retry');
            // Assessment modal will handle retry functionality
        }
    };

    // ===== LOAD INITIAL DATA =====
    useEffect(() => {
        // Try multiple ways to get the employee ID
        let empID = localStorage.getItem('empID');
        
        if (!empID) {
            // Try to get from userData
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
            const user = JSON.parse(userData);
                    empID = user.empID || user.employeeId;
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }
        }
        
        if (empID) {
            console.log('✅ Found empID:', empID);
            loadUserTrainings(empID);
                    } else {
            console.error('❌ No employee ID found in localStorage');
            setError('No employee ID found. Please log in again.');
            setLoading(false);
        }
    }, []);

    // ===== RENDER LOADING STATE =====
    if (loading) {
        return (
            <div className="training-dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Loading your trainings...</h2>
                </div>
            </div>
        );
    }

    // ===== RENDER ERROR STATE =====
    if (error) {
        return (
            <div className="training-dashboard">
                <div className="error-container">
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={() => {
                        // Try multiple ways to get the employee ID
                        let empID = localStorage.getItem('empID');
                        
                        if (!empID) {
                            // Try to get from userData
                            const userData = localStorage.getItem('userData');
                            if (userData) {
                                try {
                                    const user = JSON.parse(userData);
                                    empID = user.empID || user.employeeId;
                                } catch (e) {
                                    console.error('Error parsing userData:', e);
                                }
                            }
                        }
                        
                        if (empID) {
                            console.log('✅ Retrying with empID:', empID);
                            loadUserTrainings(empID);
                        } else {
                            console.error('❌ Still no employee ID found');
                            alert('Please log in again to continue.');
                        }
                    }}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ===== GET CURRENT TRAININGS =====
    const currentTrainings = activeTab === 'assigned' ? userModules : mandatoryTrainings;

        return (
        <div className="training-dashboard">
            {/* ===== HEADER SECTION ===== */}
            <div className="dashboard-header">
                <h1>LMS Web Training Portal</h1>
                <div className="overall-progress">
                    Overall Progress: {overallCompletion.toFixed(1)}%
                    </div>
                                    </div>
                                    
            {/* ===== TAB NAVIGATION ===== */}
            <div className="tab-navigation">
                                            <button 
                    className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
                    onClick={() => switchTab('assigned')}
                >
                    Assigned Trainings ({userModules.length})
                                            </button>
                                            <button 
                    className={`tab-button ${activeTab === 'mandatory' ? 'active' : ''}`}
                    onClick={() => switchTab('mandatory')}
                >
                    Mandatory Trainings ({mandatoryTrainings.length})
                                            </button>
                                        </div>
                                        
            {/* ===== DASHBOARD CONTENT ===== */}
            <div className="dashboard-content">
                <div className="trainings-section">
                    <h2>{activeTab === 'assigned' ? 'Assigned Trainings' : 'Mandatory Trainings'}</h2>
                    
                    {currentTrainings.length === 0 ? (
                        <div className="no-trainings">
                            <h3>No {activeTab} trainings found</h3>
                            <p>Check back later for new trainings or contact your administrator.</p>
                                </div>
                            ) : (
                        <div className="trainings-grid">
                            {currentTrainings.map((training) => (
                                <div 
                                    key={training.trainingId} 
                                    className="training-card"
                                    onClick={() => openTrainingDetails(training)}
                                >
                                    <div className="training-header">
                                        <h3>{training.name}</h3>
                                        <span className={`status-badge ${
                                            training.completionPercentage === '100.00' ? 'completed' :
                                            training.completionPercentage > '0.00' ? 'in-progress' : 'not-started'
                                        }`}>
                                            {training.completionPercentage === '100.00' ? 'COMPLETED' :
                                             training.completionPercentage > '0.00' ? 'IN PROGRESS' : 'NOT STARTED'}
                                        </span>
                                    </div>
                                    
                                    <div className="training-progress">
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                                                style={{ width: `${training.completionPercentage}%` }}
                    ></div>
                </div>
                                        <div className="progress-text">
                                            {training.completionPercentage}% Complete
            </div>
            </div>
            
                                    <div className="training-meta">
                                        <span className="type-badge">
                                            {training.type}
                </span>
                                        <span className="due-date">
                                            Due: {training.dueDate}
                </span>
            </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
                    </div>
                    
            {/* ===== TRAINING DETAILS MODAL ===== */}
            {showModal && selectedTraining && (
                <div className="training-details-modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                            <h2>{selectedTraining.name}</h2>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                            {selectedTraining.modules && selectedTraining.modules.length > 0 ? (
                                selectedTraining.modules.map((module, moduleIndex) => {
                                    const isModuleUnlocked = canWatchModule(module, moduleIndex);
                                    
                                    return (
                                        <div key={module._id} className={`module-content ${!isModuleUnlocked ? 'locked-module' : ''}`}>
                                            <div 
                                                className="module-header"
                                                onClick={() => isModuleUnlocked ? toggleModuleExpansion(module._id) : null}
                                            >
                                                <h3>{module.name}</h3>
                                                <div className="module-status">
                                                    {module.completed ? 'Completed' : isModuleUnlocked ? 'Available' : 'Locked'}
                                                </div>
                                                {isModuleUnlocked && (
                                                    <span className="expand-icon">
                                                        {module.expanded ? '−' : '+'}
                                                    </span>
                                                )}
                                                {!isModuleUnlocked && (
                                                    <span className="locked-icon">🔒</span>
                                                )}
                                            </div>
                                        
                                        {module.expanded && isModuleUnlocked && (
                                            <div className="module-videos">
                                                {module.videos && module.videos.length > 0 ? (
                                                    module.videos.map((video, index) => (
                                                        <div 
                                                            key={video._id} 
                                                            className={`video-item ${video.completed ? 'completed' : ''}`}
                                                        >
                                                                <div className="video-info">
                                                                <h4>
                                                                    {video.title}
                                                                    {index === 0 && <span className="first-video-badge"> (First Video)</span>}
                                                                </h4>
                                                                <p className="video-description">{video.description}</p>
                                                                </div>
                                                            <div className="video-actions">
                                                                {video.completed ? (
                                                                    <span className="completed-badge">Completed</span>
                                                                ) : canWatchVideo(video, module) ? (
                                                                <button 
                                                                        className="watch-button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            watchVideo(video);
                                                                        }}
                                                                    >
                                                                        Watch Video
                                                                </button>
                                                        ) : (
                                                                    <span className="locked-badge">Complete Previous Video</span>
                                                        )}
                                                            </div>
                                                    </div>
                                                    ))
                                                ) : (
                                                    <p>No videos available for this module.</p>
                                                )}
                                                    </div>
                                                )}
                                                
                                                {!isModuleUnlocked && (
                                                    <div className="module-locked-notice">
                                                        <p>🔒 Complete all videos in the previous module to unlock this module</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>No modules available for this training.</p>
                                )}
                            </div>
                    </div>
                    </div>
                )}
            
            {/* ===== VIDEO MODAL ===== */}
            {showVideoModal && currentVideo && (
                <div className="video-modal" onClick={() => setShowVideoModal(false)}>
                    <div className="video-content" onClick={(e) => e.stopPropagation()}>
                        <div className="video-header">
                            <h3>{currentVideo.title}</h3>
                            <button className="close-button" onClick={() => setShowVideoModal(false)}>×</button>
                        </div>
                        
                        <div className="video-player">
                            {currentVideo.videoUrl ? (
                                <div>
                                    <div id="youtube-player"></div>
                                    <div id="video-fallback" style={{ 
                                        padding: '20px', 
                                        textAlign: 'center', 
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '8px',
                                        marginTop: '10px',
                                        display: 'none'
                                    }}>
                                        <h3>Video Player Loading...</h3>
                                        <p>If the video doesn't load, you can watch it directly on YouTube:</p>
                                        <a 
                                            href={currentVideo.originalUrl || currentVideo.videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                                                color: 'white',
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Watch on YouTube
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: '40px', 
                                    textAlign: 'center', 
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px'
                                }}>
                                    <h3>Video Not Available</h3>
                                    <p>This video does not have a valid URL.</p>
                                    <p>Video ID: {currentVideo._id}</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Video Progress Indicator */}
                        {videoDuration > 0 && (
                            <div className="video-progress">
                                <div className="progress-info">
                                    <span>Watch Progress: {Math.round((videoWatchTime / videoDuration) * 100)}%</span>
                                    <span>Time: {Math.floor(videoWatchTime)}s / {Math.floor(videoDuration)}s</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${(videoWatchTime / videoDuration) * 100}%` }}
                                    ></div>
                                </div>
                                {!isVideoWatched && (
                                    <div className="watch-requirement">
                                        ⚠️ You must watch at least 95% of the video to mark it as complete
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="video-actions">
                            {(() => {
                                // Check if this video can be completed based on previous video completion
                                const currentModule = selectedTraining?.modules?.find(m => 
                                    m.videos?.find(v => v._id === currentVideo._id)
                                );
                                const canComplete = canMarkVideoComplete(currentVideo, currentModule);
                                
                                // Additional check: video must be watched to be completed
                                const canMarkComplete = canComplete && isVideoWatched;
                                
                                return (
                                    <>
                                        {canComplete ? (
                                            <>
                                                <div className="assessment-notice">
                                                    <p>📝 This video may have an assessment that must be completed.</p>
                                                </div>
                                                <button 
                                                    className={`complete-button ${!canMarkComplete ? 'disabled' : ''}`}
                                                    onClick={completeVideo}
                                                    disabled={!canMarkComplete}
                                                >
                                                    {canMarkComplete 
                                                        ? 'Take Assessment / Mark Complete'
                                                        : !isVideoWatched 
                                                            ? 'Watch Complete Video First'
                                                            : 'Complete Previous Video First'
                                                    }
                                                </button>
                                                
                                                {/* Temporary Debug Button */}
                                                {isVideoWatched && (
                                                    <button 
                                                        style={{
                                                            background: '#f59e0b',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '6px',
                                                            marginTop: '10px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => {
                                                            console.log('🔧 Debug: Force showing assessment modal');
                                                            console.log('🔧 Debug: Current video data:', currentVideo);
                                                            console.log('🔧 Debug: Selected training modules:', selectedTraining?.modules);
                                                            setShowAssessmentModal(true);
                                                        }}
                                                    >
                                                        🔧 Debug: Show Assessment Modal
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="locked-notice">
                                                <p>🔒 Complete the previous video first to unlock this video.</p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
            
            {/* ===== VIDEO ASSESSMENT MODAL ===== */}
            {showAssessmentModal && currentVideo && (
                <VideoAssessmentModal
                    isOpen={showAssessmentModal}
                    onClose={() => {
                        setShowAssessmentModal(false);
                        setAssessmentPassed(false);
                    }}
                    videoId={currentVideo._id}
                    videoTitle={currentVideo.title}
                    onAssessmentComplete={handleAssessmentComplete}
                    userId={userData?.mongoId || userData?._id}
                    trainingId={currentVideo.trainingId}
                    moduleId={selectedTraining?.modules?.find(m => 
                        m.videos?.find(v => v._id === currentVideo._id)
                    )?._id}
                />
            )}
        </div>
    );
};

export default TrainingDashboard;
