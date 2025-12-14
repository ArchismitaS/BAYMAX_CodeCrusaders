import cv2
import mediapipe as mp
import math
import time
import threading

# Initialize MediaPipe Pose
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Thresholds for posture checking
HEAD_TILT_THRESHOLD = 15      # degrees
SHOULDER_TILT_THRESHOLD = 20  # pixels
FORWARD_HEAD_THRESHOLD = 50   # pixels

# Eye reminder interval (20 minutes)
EYE_REMINDER_INTERVAL = 20 * 60

def calculate_angle(a, b, c):
    """Calculate angle (in degrees) between three points"""
    ba = (a[0]-b[0], a[1]-b[1])
    bc = (c[0]-b[0], c[1]-b[1])
    cosine_angle = (ba[0]*bc[0] + ba[1]*bc[1]) / (math.hypot(*ba)*math.hypot(*bc) + 1e-6)
    angle = math.degrees(math.acos(max(min(cosine_angle,1),-1)))
    return angle

def start_eye_reminder():
    """Thread for 20-20-20 eye reminder"""
    while True:
        time.sleep(EYE_REMINDER_INTERVAL)
        print("\n👀 Eye Reminder: Look at something 20 feet away for 20 seconds!\n")

def check_posture(landmarks, image_width, image_height):
    """Check posture and return alerts"""
    alerts = []

    # Extract keypoints
    nose = landmarks[mp_pose.PoseLandmark.NOSE]
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]

    # Convert normalized to pixel coordinates
    nose_xy = (nose.x * image_width, nose.y * image_height)
    l_shoulder_xy = (left_shoulder.x * image_width, left_shoulder.y * image_height)
    r_shoulder_xy = (right_shoulder.x * image_width, right_shoulder.y * image_height)

    # Shoulder tilt
    shoulder_diff_y = abs(l_shoulder_xy[1] - r_shoulder_xy[1])
    if shoulder_diff_y > SHOULDER_TILT_THRESHOLD:
        alerts.append("⚠️ Shoulders not level!")

    # Forward head
    mid_shoulder_x = (l_shoulder_xy[0] + r_shoulder_xy[0]) / 2
    nose_forward = nose_xy[0] - mid_shoulder_x
    if nose_forward > FORWARD_HEAD_THRESHOLD:
        alerts.append("⚠️ Head too far forward!")

    # Head tilt using shoulder-nose line
    angle = math.degrees(math.atan2(nose_xy[1]-l_shoulder_xy[1], nose_xy[0]-l_shoulder_xy[0]))
    if abs(angle) > HEAD_TILT_THRESHOLD:
        alerts.append("⚠️ Head tilted!")

    return alerts

def main():
    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:

        # Start eye reminder thread
        threading.Thread(target=start_eye_reminder, daemon=True).start()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert BGR to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False

            # Make detection
            results = pose.process(image)

            # Convert back to BGR
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            # Draw landmarks
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
                )

                # Check posture
                alerts = check_posture(results.pose_landmarks.landmark,
                                       image.shape[1], image.shape[0])
                for i, alert in enumerate(alerts):
                    cv2.putText(image, alert, (10, 30 + i*30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2, cv2.LINE_AA)
                    print(alert)

            cv2.imshow('Posture Monitor', image)

            if cv2.waitKey(5) & 0xFF == 27:  # Press ESC to exit
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
