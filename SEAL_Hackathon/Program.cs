using Autofac;
using Autofac.Extensions.DependencyInjection;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Services.AccessTokenService;
using Services.AccountService;
using Services.PlayerService;
using Services.RefreshTokenService;
using Services.RoleService;
using Services.SubmittedTeamService;
using Services.TeamService;
using System.Text;

namespace SEAL_Hackathon
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddMemoryCache();

            builder.Services.AddOpenApiDocument(config =>
            {
                config.Title = "SEAL Hackathon API";

                // Tạo cái ổ khóa nhập Token
                config.AddSecurity("Bearer", Enumerable.Empty<string>(), new NSwag.OpenApiSecurityScheme
                {
                    Type = NSwag.OpenApiSecuritySchemeType.ApiKey,
                    Name = "Authorization",
                    In = NSwag.OpenApiSecurityApiKeyLocation.Header,
                    Description = "Copy Token dán vào đây, nhớ thêm chữ 'Bearer ' phía trước nha (VD: Bearer eyJhbG...)"
                });

                // Ép Swagger phải đính kèm cái Token đó vào mỗi lần gọi API
                config.OperationProcessors.Add(new NSwag.Generation.Processors.Security.AspNetCoreOperationSecurityScopeProcessor("Bearer"));
            });
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "SEAL",
            ValidAudience = "SEAL_Client",
           IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("!@#!@#!@awodjasocdoajdxojasodj!@#!@$!@49293r913jdxadocans"))
        };
    });


            builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());

            builder.Host.ConfigureContainer<ContainerBuilder>(builder =>
            {
                builder.RegisterType<UnitOfWork>().As<IUnitOfWork>();
                builder.RegisterType<SealHackathonContext>().AsSelf();
                builder.RegisterType<AccountService>().As<IAccountService>();
                builder.RegisterType<RoleService>().As<IRoleService>();
                builder.RegisterType<AccessTokenService>().As<IAccessTokenService>();
                builder.RegisterType<RefreshTokenService>().As<IRefreshTokenService>();
                builder.RegisterType<TeamService>().As<ITeamService>();
                builder.RegisterType<PlayerService>().As<IPlayerService>();
                builder.RegisterType<SubmittedTeamService>().As<ISubmittedTeamService>();
            });

            var app = builder.Build();
            if (app.Environment.IsDevelopment())
            {
                // Add OpenAPI 3.0 document serving middleware
                // Available at: http://localhost:<port>/swagger/v1/swagger.json
                app.UseOpenApi();

                // Add web UIs to interact with the document
                // Available at: http://localhost:<port>/swagger
                app.UseSwaggerUi(o =>
                {
                    o.Path = "";
                }); // UseSwaggerUI Protected by if (env.IsDevelopment())
                app.UseReDoc(options =>
                {
                    options.Path = "/redoc";
                });
            }
            // Configure the HTTP request pipeline.

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
