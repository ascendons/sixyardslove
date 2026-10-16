#!/usr/bin/env bash
# ============================================================
# Six Yards Love E-com — SES + EC2 IAM Role Setup
# ============================================================
# Run this with your personal AWS admin credentials (not the
# syl-github-deploy user — it doesn't have IAM/SES access).
#
# Usage:
#   chmod +x infra/setup-ses.sh
#   ./infra/setup-ses.sh
#
# What this script does:
#   1. Verifies noreply@sixyardslove.com as an email identity in SES
#   2. Creates an IAM role for EC2 with SES send permission
#   3. Attaches the role to the running EC2 instance
#   4. Prints instructions for the DB migration
# ============================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REGION="${AWS_REGION:-ap-south-1}"
FROM_EMAIL="noreply@sixyardslove.com"
ROLE_NAME="syl-ec2-role"
INSTANCE_PROFILE_NAME="syl-ec2-profile"
SES_POLICY_NAME="syl-ses-send"

# Read EC2 instance ID from aws-outputs.env (we stored the IP, look it up)
EC2_HOST=$(grep EC2_HOST infra/aws-outputs.env | cut -d= -f2)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
section() { echo -e "\n${YELLOW}══════════════════════════════════════════${NC}";
            echo -e "${YELLOW}  $*${NC}";
            echo -e "${YELLOW}══════════════════════════════════════════${NC}"; }

# ── Preflight ─────────────────────────────────────────────────────────────────
section "0. Preflight"
command -v aws >/dev/null 2>&1 || { echo "${RED}ERROR: aws cli not found${NC}"; exit 1; }
aws sts get-caller-identity --region "$REGION" > /dev/null 2>&1 || \
  { echo "${RED}ERROR: AWS credentials not configured. Run: aws configure${NC}"; exit 1; }
info "Account: $ACCOUNT_ID | Region: $REGION"
info "EC2 host from aws-outputs.env: $EC2_HOST"

# ── 1. Verify email identity in SES ──────────────────────────────────────────
section "1. SES Email Identity — $FROM_EMAIL"

IDENTITY_STATUS=$(aws sesv2 get-email-identity \
  --email-identity "$FROM_EMAIL" \
  --region "$REGION" \
  --query 'VerifiedForSendingStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$IDENTITY_STATUS" = "True" ]; then
  info "✓ $FROM_EMAIL is already verified in SES ($REGION)"
elif [ "$IDENTITY_STATUS" = "False" ]; then
  warn "$FROM_EMAIL exists in SES but is not yet verified — check your email for the verification link"
else
  info "Creating SES email identity for $FROM_EMAIL ..."
  aws sesv2 create-email-identity \
    --email-identity "$FROM_EMAIL" \
    --region "$REGION"
  warn "A verification email has been sent to $FROM_EMAIL."
  warn "Log in to that inbox and click the verification link before emails can be sent."
fi

# Check if SES is still in sandbox
SEND_QUOTA=$(aws sesv2 get-account --region "$REGION" --query 'SendQuota' --output json 2>/dev/null || echo "{}")
MAX_SEND=$(echo "$SEND_QUOTA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Max24HourSend','unknown'))" 2>/dev/null || echo "unknown")
if [ "$MAX_SEND" = "200.0" ] || [ "$MAX_SEND" = "200" ]; then
  warn "SES is in SANDBOX mode (max 200/day, only verified recipients)."
  warn "To send to real users: https://console.aws.amazon.com/ses/home?region=$REGION#/account"
  warn "  → Request production access under 'Account dashboard'"
else
  info "SES appears to be in production mode (max send/day: $MAX_SEND)"
fi

# ── 2. Create IAM role for EC2 ───────────────────────────────────────────────
section "2. IAM Role for EC2 ($ROLE_NAME)"

# Create role with EC2 trust policy
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }' 2>/dev/null && info "IAM role $ROLE_NAME created" || warn "Role $ROLE_NAME already exists"

# Create minimal SES send policy
SES_POLICY_DOC="{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Action\": [\"ses:SendEmail\", \"sesv2:SendEmail\"],
    \"Resource\": \"*\",
    \"Condition\": {
      \"StringEquals\": {
        \"ses:FromAddress\": \"$FROM_EMAIL\"
      }
    }
  }]
}"

SES_POLICY_ARN=$(aws iam create-policy \
  --policy-name "$SES_POLICY_NAME" \
  --policy-document "$SES_POLICY_DOC" \
  --query 'Policy.Arn' --output text 2>/dev/null || \
  aws iam list-policies \
    --query "Policies[?PolicyName=='$SES_POLICY_NAME'].Arn" \
    --output text)

info "SES policy ARN: $SES_POLICY_ARN"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$SES_POLICY_ARN" 2>/dev/null || true
info "Policy attached to role"

# ── 3. Create instance profile and attach to EC2 ──────────────────────────────
section "3. Instance Profile → EC2"

aws iam create-instance-profile \
  --instance-profile-name "$INSTANCE_PROFILE_NAME" 2>/dev/null && \
  info "Instance profile created" || warn "Instance profile already exists"

aws iam add-role-to-instance-profile \
  --instance-profile-name "$INSTANCE_PROFILE_NAME" \
  --role-name "$ROLE_NAME" 2>/dev/null || warn "Role already in instance profile"

# Look up instance ID from EC2 IP
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=ip-address,Values=$EC2_HOST" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text --region "$REGION")

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  warn "Could not find EC2 instance with IP $EC2_HOST. Trying by tag..."
  INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=syl-backend" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text --region "$REGION")
fi

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo -e "${RED}ERROR: Could not find EC2 instance. Attach profile manually:${NC}"
  echo "  aws ec2 associate-iam-instance-profile \\"
  echo "    --instance-id <YOUR_INSTANCE_ID> \\"
  echo "    --iam-instance-profile Name=$INSTANCE_PROFILE_NAME \\"
  echo "    --region $REGION"
else
  info "EC2 Instance ID: $INSTANCE_ID"

  # Check if profile already attached
  CURRENT_PROFILE=$(aws ec2 describe-iam-instance-profile-associations \
    --filters "Name=instance-id,Values=$INSTANCE_ID" \
    --query 'IamInstanceProfileAssociations[0].IamInstanceProfile.Arn' \
    --output text --region "$REGION" 2>/dev/null || echo "None")

  if [ "$CURRENT_PROFILE" != "None" ] && [ -n "$CURRENT_PROFILE" ]; then
    info "Instance profile already attached: $CURRENT_PROFILE"
  else
    aws ec2 associate-iam-instance-profile \
      --instance-id "$INSTANCE_ID" \
      --iam-instance-profile "Name=$INSTANCE_PROFILE_NAME" \
      --region "$REGION"
    info "✓ IAM role attached to EC2 instance — no restart needed"
  fi
fi

# ── Done ─────────────────────────────────────────────────────────────────────
section "DONE"
echo ""
echo -e "${GREEN}SES setup complete. Next steps:${NC}"
echo ""
echo "1. Verify noreply@sixyardslove.com email (check that inbox if not already done)"
echo ""
echo "2. Run the DB migration on the EC2 server:"
echo "   ssh -i ~/.ssh/syl-ec2-key.pem ubuntu@$EC2_HOST"
echo "   psql \$DB_URL < /path/to/infra/db/migrations/001_add_email_verification.sql"
echo "   # Or: scp the file first:"
echo "   scp -i ~/.ssh/syl-ec2-key.pem infra/db/migrations/001_add_email_verification.sql ubuntu@$EC2_HOST:/tmp/"
echo "   ssh -i ~/.ssh/syl-ec2-key.pem ubuntu@$EC2_HOST \"sudo -u postgres psql syl_db < /tmp/001_add_email_verification.sql\""
echo ""
echo "3. If SES is in sandbox, request production access at:"
echo "   https://console.aws.amazon.com/ses/home?region=$REGION#/account"
echo ""
echo "4. Deploy the backend with the new build to pick up the changes."
echo ""
