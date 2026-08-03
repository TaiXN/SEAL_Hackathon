using APIViewModels.Auth;
using APIViewModels.Gmail;
using APIViewModels.Student;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Services.PlayerService
{
    public class PlayerService : IPlayerService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";

        public PlayerService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> RegisterPlayerAsync(RegisterAPIViewModel info)
        {

            var isClone = await _uow.Student.GetFirstOrDefaultAsync(s => s.CccdNumber == info.CccdNumber);
            if (isClone != null)
            {
                throw new Exception("This ID card has already been used.");
            }

            CloudinaryDotNet.Account cloudAccount = new CloudinaryDotNet.Account(
                "ndct1evc", 
                "723631468677837", 
                "O0--MXSw4fGhx-yZaIlK1d0O1dI" 
            );
            Cloudinary cloudinary = new Cloudinary(cloudAccount);

            string uploadedIdCardUrl = "";
            string uploadedStudentCardUrl = "";

            if (info.IdCardImage != null && info.IdCardImage.Length > 0)
            {
                using (var stream = info.IdCardImage.OpenReadStream())
                {
                    var uploadParams = new ImageUploadParams()
                    {
                        File = new FileDescription(info.IdCardImage.FileName, stream),
                        PublicId = $"seal_hackathon/cccd_{info.Email.Replace("@", "_")}"
                    };
                    var uploadResult = await cloudinary.UploadAsync(uploadParams);
                    uploadedIdCardUrl = uploadResult.SecureUrl.ToString();
                }
            }
            else throw new Exception("please uploade your id card");

            if (info.StudentCardImage != null && info.StudentCardImage.Length > 0)
            {
                using (var stream = info.StudentCardImage.OpenReadStream())
                {
                    var uploadParams = new ImageUploadParams()
                    {
                        File = new FileDescription(info.StudentCardImage.FileName, stream),
                        PublicId = $"seal_hackathon/studentcard_{info.Email.Replace("@", "_")}"
                    };
                    var uploadResult = await cloudinary.UploadAsync(uploadParams);
                    uploadedStudentCardUrl = uploadResult.SecureUrl.ToString();
                }
            }
            else throw new Exception("please upload your Student Card");

            Random rand = new Random();
            string generatedOtp = rand.Next(100000, 999999).ToString();

            var existingAcc = await _uow.Account.GetFirstOrDefaultAsync(a => a.Email == info.Email);

            if (existingAcc != null)
            {
                var existingStudent = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == existingAcc.AccountId);

                if (existingAcc.IsEmailConfirmed)
                {
                    return false; 
                }

                existingAcc.Password = HashBuilder.ComputeSha256Hash(info.Password + PRIVATEKEY);
                existingAcc.FullName = info.FullName;
                existingAcc.Address = info.Address;
                existingAcc.Phone = info.Phone;
                existingAcc.OtpCode = generatedOtp;
                existingAcc.OtpExpiryTime = DateTime.UtcNow.AddHours(7).AddMinutes(15);

                if (existingStudent != null)
                {
                    existingStudent.UniversityId = info.UniversityId;
                    existingStudent.IdCardImageUrl = uploadedIdCardUrl;
                    existingStudent.StudentCardImageUrl = uploadedStudentCardUrl; 
                    existingStudent.CccdNumber = info.CccdNumber;
                    _uow.Student.Update(existingStudent);
                }

                _uow.Account.Update(existingAcc);
                SendEmailOTP(existingAcc.Email, generatedOtp);
                await _uow.SaveAsync();
                return true;
            }

            var playerRole = await _uow.Role.GetFirstOrDefaultAsync(r => r.RoleName == "Player" || r.RoleName == "Student");
            if (playerRole == null) throw new Exception("ERROR: Cannot find player role in database");

            string newAccountId = Guid.NewGuid().ToString();
            var newAccount = new DataAccess.Entities.Account
            {
                AccountId = newAccountId,
                RoleId = playerRole.RoleId,
                Email = info.Email,
                Password = HashBuilder.ComputeSha256Hash(info.Password + PRIVATEKEY),
                FullName = info.FullName,
                Address = info.Address,
                Phone = info.Phone,
                IsActive = true,
                IsEmailConfirmed = false,
                OtpCode = generatedOtp,
                OtpExpiryTime = DateTime.UtcNow.AddHours(7).AddMinutes(15)
            };
            await _uow.Account.AddAsync(newAccount);

            var newStudent = new Student
            {
                StudentId = newAccountId,
                UniversityId = info.UniversityId,
                IsApproved = false,
                IdCardImageUrl = uploadedIdCardUrl,
                StudentCardImageUrl = uploadedStudentCardUrl, 
                CccdNumber = info.CccdNumber
            };
            await _uow.Student.AddAsync(newStudent);

            SendEmailOTP(newAccount.Email, generatedOtp);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> VerifyEmailOtpAsync(VerifyOtpAPIViewModel request)
        {
            var account = await _uow.Account.GetFirstOrDefaultAsync(a => a.Email == request.Email);
            if (account == null) throw new Exception("Account not found!");

            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == account.AccountId);
            if (student == null) throw new Exception("Student information not found!");

            if (account.IsEmailConfirmed) throw new Exception("This account has already been verified!");
            if (account.OtpCode != request.OtpCode) throw new Exception("Invalid OTP code!");
            if (DateTime.UtcNow.AddHours(7) > account.OtpExpiryTime) throw new Exception("OTP code has expired! Please request a new one.");

            account.IsEmailConfirmed = true;
            account.OtpCode = null;
            account.OtpExpiryTime = null;

            _uow.Account.Update(account);
            await _uow.SaveAsync();

            return true;
        }

        private void SendEmailOTP(string toEmail, string otpCode)
        {
            try
            {
                string fromEmail = "tkchgpt1@gmail.com";
                string appPassword = "nxsb ojwi cpib pcug";

                MailMessage mail = new MailMessage();
                mail.From = new MailAddress(fromEmail, "SEAL Hackathon System");
                mail.To.Add(toEmail);
                mail.Subject = "Hackathon Account Verification Code";
                mail.Body = $"<h3>Welcome to FPT Edu Hackathon!</h3>" +
                            $"<p>Your OTP verification code is: <b style='color:red; font-size: 20px;'>{otpCode}</b></p>" +
                            $"<p>This code will expire in 15 minutes. Do not share this code with anyone.</p>";
                mail.IsBodyHtml = true;

                using (SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587))
                {
                    smtp.Credentials = new System.Net.NetworkCredential(fromEmail, appPassword);
                    smtp.EnableSsl = true;
                    smtp.Send(mail);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
            }
        }

        public async Task<bool> ApprovePlayerAsync(string studentId)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == studentId);
            if (student == null) return false;

            student.IsApproved = true;
            _uow.Student.Update(student);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<List<StudentAPIViewModel>> GetPendingPlayersAsync()
        {
            var pendingList = await _uow.Student.GetAllAsync(
                            s => s.IsApproved == false && s.StudentNavigation.IsEmailConfirmed == true,
                            includeProperties: "StudentNavigation,University"
            );

            return pendingList.Select(s => new StudentAPIViewModel
            {
                StudentId = s.StudentId,
                FullName = s.StudentNavigation?.FullName,
                Email = s.StudentNavigation?.Email,
                Phone = s.StudentNavigation?.Phone,
                UniversityName = s.University?.UniversityName,
                IdCardImageUrl = s.IdCardImageUrl,
                StudentCardImageUrl = s.StudentCardImageUrl, 
                CccdNumber = s.CccdNumber
            }).ToList();
        }

        public async Task<bool> RejectPlayerAsync(string studentId)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == studentId);
            if (student == null) return false;

            var account = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == studentId);

            var tokens = await _uow.RefreshToken.GetAllAsync(rt => rt.AccountId == studentId);
            if (tokens != null && tokens.Any())
            {
                _uow.RefreshToken.RemoveRange(tokens);
            }

            _uow.Student.Remove(student);
            if (account != null) _uow.Account.Remove(account);

            await _uow.SaveAsync();
            return true;
        }
    }
}