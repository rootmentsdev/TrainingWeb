import React, { useState, useEffect } from 'react';
import { lmswebAPI } from '../api/api.js';
import './VideoAssessmentModal.css';

const VideoAssessmentModal = ({ 
    isOpen, 
    onClose, 
    videoId, 
    videoTitle, 
    onAssessmentComplete,
    userId,
    trainingId,
    moduleId
}) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);
    const [results, setResults] = useState(null);

    // Load assessment questions when modal opens
    useEffect(() => {
        if (isOpen && videoId) {
            loadAssessmentQuestions();
        }
    }, [isOpen, videoId]);

    const loadAssessmentQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Loading assessment questions for video:', videoId);
            const response = await lmswebAPI.getVideoAssessment(videoId);
            
            if (response && response.success && response.data) {
                console.log('✅ Assessment questions loaded:', response.data);
                setQuestions(response.data.questions || []);
                
                // Initialize answers object
                const initialAnswers = {};
                response.data.questions.forEach(q => {
                    initialAnswers[q._id] = '';
                });
                setAnswers(initialAnswers);
            } else {
                console.error('❌ Invalid response from assessment API');
                setError('Failed to load assessment questions');
            }
        } catch (error) {
            console.error('❌ Error loading assessment questions:', error);
            setError('Error loading assessment questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, selectedAnswer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedAnswer
        }));
    };

    const handleSubmitAssessment = async () => {
        try {
            setSubmitting(true);
            setError(null);
            
            // Validate that all questions are answered
            const unansweredQuestions = questions.filter(q => !answers[q._id]);
            if (unansweredQuestions.length > 0) {
                setError('Please answer all questions before submitting.');
                return;
            }
            
            // Prepare answers array
            const answersArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
                questionId,
                selectedAnswer
            }));
            
            console.log('📝 Submitting assessment answers:', {
                videoId,
                answers: answersArray,
                userId,
                trainingId,
                moduleId
            });
            
            const response = await lmswebAPI.submitVideoAssessmentAnswers(videoId, answersArray);
            
            if (response && response.success && response.data) {
                console.log('✅ Assessment submitted successfully:', response.data);
                setResults(response.data);
                setAssessmentCompleted(true);
                
                // Call the completion callback
                if (onAssessmentComplete) {
                    onAssessmentComplete(response.data);
                }
            } else {
                console.error('❌ Invalid response from assessment submission');
                setError('Failed to submit assessment. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error submitting assessment:', error);
            setError('Error submitting assessment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setQuestions([]);
            setAnswers({});
            setError(null);
            setAssessmentCompleted(false);
            setResults(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="video-assessment-modal-overlay" onClick={handleClose}>
            <div className="video-assessment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="video-assessment-header">
                    <h3>Assessment: {videoTitle}</h3>
                    <button 
                        className="close-button" 
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        ×
                    </button>
                </div>
                
                <div className="video-assessment-content">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading assessment questions...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            <button 
                                className="retry-button"
                                onClick={loadAssessmentQuestions}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : assessmentCompleted ? (
                        <div className="results-container">
                            <div className="results-header">
                                <h4>Assessment Results</h4>
                                <div className={`score-badge ${results.passed ? 'passed' : 'failed'}`}>
                                    {results.passed ? 'PASSED' : 'FAILED'}
                                </div>
                            </div>
                            
                            <div className="score-details">
                                <p>Score: <strong>{results.score.toFixed(1)}%</strong></p>
                                <p>Correct Answers: <strong>{results.correctAnswers}</strong> out of <strong>{results.totalQuestions}</strong></p>
                            </div>
                            
                            {results.passed ? (
                                <div className="success-message">
                                    <p>🎉 Congratulations! You have successfully completed the assessment.</p>
                                    <p>You can now mark this video as complete.</p>
                                </div>
                            ) : (
                                <div className="failure-message">
                                    <p>❌ You need to score at least 70% to pass this assessment.</p>
                                    <p>Please review the video content and try again.</p>
                                </div>
                            )}
                            
                            <div className="results-actions">
                                {results.passed ? (
                                    <button 
                                        className="continue-button"
                                        onClick={handleClose}
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button 
                                        className="retry-assessment-button"
                                        onClick={() => {
                                            setAssessmentCompleted(false);
                                            setResults(null);
                                            setAnswers({});
                                        }}
                                    >
                                        Retry Assessment
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="questions-container">
                            <div className="assessment-instructions">
                                <p>Please answer all questions below. You need to score at least 70% to pass this assessment.</p>
                                <p>Questions: <strong>{questions.length}</strong></p>
                            </div>
                            
                            {questions.map((question, index) => (
                                <div key={question._id} className="question-item">
                                    <h4>Question {index + 1}</h4>
                                    <p className="question-text">{question.questionText}</p>
                                    
                                    <div className="options-container">
                                        {question.options.map((option, optionIndex) => (
                                            <label key={optionIndex} className="option-label">
                                                <input
                                                    type="radio"
                                                    name={question._id}
                                                    value={option}
                                                    checked={answers[question._id] === option}
                                                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                                />
                                                <span className="option-text">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="assessment-actions">
                                <button 
                                    className="submit-assessment-button"
                                    onClick={handleSubmitAssessment}
                                    disabled={submitting || Object.values(answers).some(answer => !answer)}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoAssessmentModal;
