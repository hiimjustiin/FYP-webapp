import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-6">
          <div className="dashboard-card px-4 py-2">
            <h5 className="heading-5">
              Hi{user?.display_name ? `, ${user.display_name}` : ""}!
            </h5>
            <p className="subtitle-2 text-grey-80">
              Let's begin a new project with ILA!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
